// Complete Liquid Ether Implementation - Real Fluid Simulation
class LiquidEther {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      colors: ['#F97316', '#FB923C', '#FED7AA'],
      mouseForce: 20,
      cursorSize: 100,
      resolution: 0.5,
      autoDemo: true,
      autoSpeed: 0.5,
      autoIntensity: 2.2,
      ...options
    };

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupFluidSimulation();
    this.setupMouse();
    this.setupAutoDriver();
    this.setupEventListeners();
    this.start();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer.domElement);
  }

  setupFluidSimulation() {
    const width = Math.floor(this.container.clientWidth * this.options.resolution);
    const height = Math.floor(this.container.clientHeight * this.options.resolution);
    
    this.fluidSize = { width, height };
    
    // Create velocity field
    this.velocityTexture = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
    
    // Create color field
    this.colorTexture = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
    
    // Create temporary textures for ping-pong
    this.tempVelocityTexture = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
    
    this.tempColorTexture = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.FloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    });
    
    this.setupShaders();
    this.setupOutput();
  }

  setupShaders() {
    const width = this.fluidSize.width;
    const height = this.fluidSize.height;
    
    // Advection shader
    this.advectionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        velocity: { value: this.velocityTexture.texture },
        dt: { value: 0.016 },
        fboSize: { value: new THREE.Vector2(width, height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D velocity;
        uniform float dt;
        uniform vec2 fboSize;
        varying vec2 vUv;
        
        void main() {
          vec2 vel = texture2D(velocity, vUv).xy;
          vec2 newUv = vUv - vel * dt;
          vec2 newVel = texture2D(velocity, newUv).xy;
          gl_FragColor = vec4(newVel, 0.0, 1.0);
        }
      `
    });
    
    // Color advection shader
    this.colorAdvectionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: this.colorTexture.texture },
        velocity: { value: this.velocityTexture.texture },
        dt: { value: 0.016 },
        fboSize: { value: new THREE.Vector2(width, height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D color;
        uniform sampler2D velocity;
        uniform float dt;
        uniform vec2 fboSize;
        varying vec2 vUv;
        
        void main() {
          vec2 vel = texture2D(velocity, vUv).xy;
          vec2 newUv = vUv - vel * dt;
          vec4 newColor = texture2D(color, newUv);
          newColor.rgb *= 0.99; // Fade out
          gl_FragColor = newColor;
        }
      `
    });
    
    // Force injection shader
    this.forceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        velocity: { value: this.velocityTexture.texture },
        force: { value: new THREE.Vector2(0, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        radius: { value: 0.1 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D velocity;
        uniform vec2 force;
        uniform vec2 center;
        uniform float radius;
        varying vec2 vUv;
        
        void main() {
          vec2 vel = texture2D(velocity, vUv).xy;
          float dist = distance(vUv, center);
          float influence = 1.0 - smoothstep(0.0, radius, dist);
          vel += force * influence;
          gl_FragColor = vec4(vel, 0.0, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending
    });
    
    // Color injection shader
    this.colorInjectionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: this.colorTexture.texture },
        newColor: { value: new THREE.Vector3(1, 0.5, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        radius: { value: 0.1 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D color;
        uniform vec3 newColor;
        uniform vec2 center;
        uniform float radius;
        varying vec2 vUv;
        
        void main() {
          vec4 currentColor = texture2D(color, vUv);
          float dist = distance(vUv, center);
          float influence = 1.0 - smoothstep(0.0, radius, dist);
          vec3 mixedColor = mix(currentColor.rgb, newColor, influence);
          gl_FragColor = vec4(mixedColor, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending
    });
    
    // Divergence shader
    this.divergenceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        velocity: { value: this.velocityTexture.texture },
        px: { value: new THREE.Vector2(1.0 / width, 1.0 / height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D velocity;
        uniform vec2 px;
        varying vec2 vUv;
        
        void main() {
          float x0 = texture2D(velocity, vUv - vec2(px.x, 0.0)).x;
          float x1 = texture2D(velocity, vUv + vec2(px.x, 0.0)).x;
          float y0 = texture2D(velocity, vUv - vec2(0.0, px.y)).y;
          float y1 = texture2D(velocity, vUv + vec2(0.0, px.y)).y;
          float divergence = (x1 - x0 + y1 - y0) / 2.0;
          gl_FragColor = vec4(divergence);
        }
      `
    });
    
    // Pressure solve shader
    this.pressureMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pressure: { value: this.tempColorTexture.texture },
        divergence: { value: this.tempVelocityTexture.texture },
        px: { value: new THREE.Vector2(1.0 / width, 1.0 / height) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D pressure;
        uniform sampler2D divergence;
        uniform vec2 px;
        varying vec2 vUv;
        
        void main() {
          float p0 = texture2D(pressure, vUv + vec2(px.x * 2.0, 0.0)).r;
          float p1 = texture2D(pressure, vUv - vec2(px.x * 2.0, 0.0)).r;
          float p2 = texture2D(pressure, vUv + vec2(0.0, px.y * 2.0)).r;
          float p3 = texture2D(pressure, vUv - vec2(0.0, px.y * 2.0)).r;
          float div = texture2D(divergence, vUv).r;
          float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
          gl_FragColor = vec4(newP);
        }
      `
    });
    
    // Pressure gradient shader
    this.pressureGradientMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pressure: { value: this.tempColorTexture.texture },
        velocity: { value: this.velocityTexture.texture },
        px: { value: new THREE.Vector2(1.0 / width, 1.0 / height) },
        dt: { value: 0.016 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D pressure;
        uniform sampler2D velocity;
        uniform vec2 px;
        uniform float dt;
        varying vec2 vUv;
        
        void main() {
          float p0 = texture2D(pressure, vUv + vec2(px.x, 0.0)).r;
          float p1 = texture2D(pressure, vUv - vec2(px.x, 0.0)).r;
          float p2 = texture2D(pressure, vUv + vec2(0.0, px.y)).r;
          float p3 = texture2D(pressure, vUv - vec2(0.0, px.y)).r;
          vec2 v = texture2D(velocity, vUv).xy;
          vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
          v = v - gradP * dt;
          gl_FragColor = vec4(v, 0.0, 1.0);
        }
      `
    });
  }

  setupOutput() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Create output shader
    this.outputMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: this.colorTexture.texture },
        velocity: { value: this.velocityTexture.texture },
        palette: { value: this.createPaletteTexture() }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D color;
        uniform sampler2D velocity;
        uniform sampler2D palette;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(color, vUv);
          vec2 vel = texture2D(velocity, vUv).xy;
          float speed = length(vel);
          
          // Mix with palette based on velocity
          vec3 paletteColor = texture2D(palette, vec2(speed, 0.5)).rgb;
          vec3 finalColor = mix(color.rgb, paletteColor, 0.5);
          
          gl_FragColor = vec4(finalColor, color.a);
        }
      `,
      transparent: true
    });
    
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.outputMaterial
    );
    this.scene.add(this.quad);
  }

  createPaletteTexture() {
    const colors = this.options.colors;
    const data = new Uint8Array(colors.length * 4);
    for (let i = 0; i < colors.length; i++) {
      const color = new THREE.Color(colors[i]);
      data[i * 4 + 0] = Math.round(color.r * 255);
      data[i * 4 + 1] = Math.round(color.g * 255);
      data[i * 4 + 2] = Math.round(color.b * 255);
      data[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, colors.length, 1, THREE.RGBAFormat);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  setupMouse() {
    this.mouse = {
      coords: new THREE.Vector2(),
      coords_old: new THREE.Vector2(),
      diff: new THREE.Vector2(),
      isHoverInside: false,
      hasUserControl: false,
      isAutoActive: false
    };

    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this));
  }

  setupAutoDriver() {
    this.lastUserInteraction = performance.now();
    this.autoDriver = {
      enabled: this.options.autoDemo,
      speed: this.options.autoSpeed,
      resumeDelay: 1000,
      active: false,
      current: new THREE.Vector2(0, 0),
      target: new THREE.Vector2(),
      lastTime: performance.now(),
      activationTime: 0,
      margin: 0.2
    };
    this.pickNewTarget();
  }

  setupEventListeners() {
    this.resizeHandler = this.resize.bind(this);
    this.loopHandler = this.loop.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    
    const width = Math.floor(rect.width * this.options.resolution);
    const height = Math.floor(rect.height * this.options.resolution);
    
    if (width !== this.fluidSize.width || height !== this.fluidSize.height) {
      this.fluidSize = { width, height };
      this.velocityTexture.setSize(width, height);
      this.colorTexture.setSize(width, height);
      this.tempVelocityTexture.setSize(width, height);
      this.tempColorTexture.setSize(width, height);
    }
  }

  onMouseMove(event) {
    this.lastUserInteraction = performance.now();
    if (this.autoDriver.active) {
      this.autoDriver.active = false;
      this.mouse.isAutoActive = false;
    }
    this.setCoords(event.clientX, event.clientY);
    this.mouse.hasUserControl = true;
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.lastUserInteraction = performance.now();
      const t = event.touches[0];
      this.setCoords(t.pageX, t.pageY);
      this.mouse.hasUserControl = true;
    }
  }

  onTouchMove(event) {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      this.setCoords(t.pageX, t.pageY);
    }
  }

  onMouseEnter() {
    this.mouse.isHoverInside = true;
  }

  onMouseLeave() {
    this.mouse.isHoverInside = false;
  }

  setCoords(x, y) {
    const rect = this.container.getBoundingClientRect();
    const nx = (x - rect.left) / rect.width;
    const ny = (y - rect.top) / rect.height;
    this.mouse.coords.set(nx, ny);
  }

  pickNewTarget() {
    const r = Math.random;
    this.autoDriver.target.set(r(), r());
  }

  updateAutoDriver() {
    if (!this.autoDriver.enabled) return;
    const now = performance.now();
    const idle = now - this.lastUserInteraction;
    if (idle < this.autoDriver.resumeDelay) {
      if (this.autoDriver.active) {
        this.autoDriver.active = false;
        this.mouse.isAutoActive = false;
      }
      return;
    }
    if (this.mouse.isHoverInside) {
      if (this.autoDriver.active) {
        this.autoDriver.active = false;
        this.mouse.isAutoActive = false;
      }
      return;
    }
    if (!this.autoDriver.active) {
      this.autoDriver.active = true;
      this.autoDriver.current.copy(this.mouse.coords);
      this.autoDriver.lastTime = now;
      this.autoDriver.activationTime = now;
    }
    if (!this.autoDriver.active) return;
    this.mouse.isAutoActive = true;
    let dtSec = (now - this.autoDriver.lastTime) / 1000;
    this.autoDriver.lastTime = now;
    if (dtSec > 0.2) dtSec = 0.016;
    const dir = new THREE.Vector2().subVectors(this.autoDriver.target, this.autoDriver.current);
    const dist = dir.length();
    if (dist < 0.01) {
      this.pickNewTarget();
      return;
    }
    dir.normalize();
    const step = this.autoDriver.speed * dtSec;
    const move = Math.min(step, dist);
    this.autoDriver.current.addScaledVector(dir, move);
    this.mouse.coords.copy(this.autoDriver.current);
  }

  updateMouse() {
    this.mouse.diff.subVectors(this.mouse.coords, this.mouse.coords_old);
    this.mouse.coords_old.copy(this.mouse.coords);
    if (this.mouse.coords_old.x === 0 && this.mouse.coords_old.y === 0) this.mouse.diff.set(0, 0);
    if (this.mouse.isAutoActive) this.mouse.diff.multiplyScalar(this.options.autoIntensity);
  }

  updateFluid() {
    // Advection step
    this.renderer.setRenderTarget(this.tempVelocityTexture);
    this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.advectionMaterial)), this.camera);
    
    // Swap textures
    const temp = this.velocityTexture;
    this.velocityTexture = this.tempVelocityTexture;
    this.tempVelocityTexture = temp;
    this.advectionMaterial.uniforms.velocity.value = this.velocityTexture.texture;
    
    // Color advection
    this.renderer.setRenderTarget(this.tempColorTexture);
    this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.colorAdvectionMaterial)), this.camera);
    
    // Swap color textures
    const tempColor = this.colorTexture;
    this.colorTexture = this.tempColorTexture;
    this.tempColorTexture = tempColor;
    this.colorAdvectionMaterial.uniforms.color.value = this.colorTexture.texture;
    
    // Force injection
    if (this.mouse.diff.length() > 0.001) {
      this.forceMaterial.uniforms.force.value.set(this.mouse.diff.x * this.options.mouseForce, this.mouse.diff.y * this.options.mouseForce);
      this.forceMaterial.uniforms.center.value.set(this.mouse.coords.x, this.mouse.coords.y);
      this.forceMaterial.uniforms.radius.value = this.options.cursorSize / 1000.0;
      
      this.renderer.setRenderTarget(this.velocityTexture);
      this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.forceMaterial)), this.camera);
      
      // Color injection
      const colorIndex = Math.floor(Math.random() * this.options.colors.length);
      const color = new THREE.Color(this.options.colors[colorIndex]);
      this.colorInjectionMaterial.uniforms.newColor.value.set(color.r, color.g, color.b);
      this.colorInjectionMaterial.uniforms.center.value.set(this.mouse.coords.x, this.mouse.coords.y);
      this.colorInjectionMaterial.uniforms.radius.value = this.options.cursorSize / 1000.0;
      
      this.renderer.setRenderTarget(this.colorTexture);
      this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.colorInjectionMaterial)), this.camera);
    }
    
    // Pressure solve
    this.divergenceMaterial.uniforms.velocity.value = this.velocityTexture.texture;
    this.renderer.setRenderTarget(this.tempVelocityTexture);
    this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.divergenceMaterial)), this.camera);
    
    // Pressure iterations
    for (let i = 0; i < 20; i++) {
      this.pressureMaterial.uniforms.pressure.value = this.tempColorTexture.texture;
      this.pressureMaterial.uniforms.divergence.value = this.tempVelocityTexture.texture;
      this.renderer.setRenderTarget(this.tempColorTexture);
      this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.pressureMaterial)), this.camera);
      
      // Swap pressure textures
      const tempPressure = this.tempColorTexture;
      this.tempColorTexture = this.tempVelocityTexture;
      this.tempVelocityTexture = tempPressure;
    }
    
    // Pressure gradient
    this.pressureGradientMaterial.uniforms.pressure.value = this.tempColorTexture.texture;
    this.pressureGradientMaterial.uniforms.velocity.value = this.velocityTexture.texture;
    this.renderer.setRenderTarget(this.velocityTexture);
    this.renderer.render(new THREE.Scene().add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.pressureGradientMaterial)), this.camera);
    
    this.renderer.setRenderTarget(null);
  }

  render() {
    this.updateAutoDriver();
    this.updateMouse();
    this.updateFluid();
    
    this.outputMaterial.uniforms.color.value = this.colorTexture.texture;
    this.outputMaterial.uniforms.velocity.value = this.velocityTexture.texture;
    
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    if (!this.running) return;
    this.render();
    this.rafId = requestAnimationFrame(this.loopHandler);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  pause() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose() {
    try {
      window.removeEventListener('resize', this.resizeHandler);
      if (this.renderer) {
        const canvas = this.renderer.domElement;
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        this.renderer.dispose();
      }
    } catch (e) {
      // Silent error handling
    }
  }
}

// Export for use
window.LiquidEther = LiquidEther;