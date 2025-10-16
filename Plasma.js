// Simple Plasma Effect - Working version
class Plasma {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      color: '#F97316',
      speed: 0.6,
      direction: 'forward',
      scale: 1.1,
      opacity: 0.8,
      mouseInteractive: true,
      ...options
    };

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.setupMouse();
    this.setupEventListeners();
    this.start();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true
    });
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

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Convert hex to RGB
    const hex = this.options.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mouse;
      uniform vec3 color;
      uniform float speed;
      uniform float scale;
      uniform float opacity;
      uniform float mouseInteractive;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5, 0.5);
        
        // Mouse interaction
        vec2 mouseOffset = (mouse - center) * 0.1;
        uv += mouseOffset * mouseInteractive;
        
        // Plasma effect
        float time = time * speed;
        float plasma = 0.0;
        
        // Multiple plasma layers
        plasma += sin(uv.x * 10.0 + time) * 0.5;
        plasma += sin(uv.y * 10.0 + time * 1.2) * 0.5;
        plasma += sin((uv.x + uv.y) * 5.0 + time * 0.8) * 0.3;
        plasma += sin(sqrt(uv.x * uv.x + uv.y * uv.y) * 8.0 + time * 1.5) * 0.4;
        
        // Add some noise
        plasma += sin(uv.x * 20.0 + time * 2.0) * 0.1;
        plasma += sin(uv.y * 20.0 + time * 2.5) * 0.1;
        
        // Normalize and apply color
        plasma = (plasma + 1.0) * 0.5;
        plasma = pow(plasma, 2.0);
        
        vec3 finalColor = color * plasma;
        float alpha = plasma * opacity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(this.container.clientWidth, this.container.clientHeight) },
        mouse: { value: new THREE.Vector2(0, 0) },
        color: { value: new THREE.Vector3(r, g, b) },
        speed: { value: this.options.speed },
        scale: { value: this.options.scale },
        opacity: { value: this.options.opacity },
        mouseInteractive: { value: this.options.mouseInteractive ? 1.0 : 0.0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true
    });

    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );
    this.scene.add(this.quad);
  }

  setupMouse() {
    this.mouse = new THREE.Vector2(0, 0);
    
    this.container.addEventListener('mousemove', (event) => {
      if (!this.options.mouseInteractive) return;
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = (event.clientX - rect.left) / rect.width;
      this.mouse.y = (event.clientY - rect.top) / rect.height;
      this.material.uniforms.mouse.value.set(this.mouse.x, this.mouse.y);
    });

    this.container.addEventListener('touchmove', (event) => {
      if (!this.options.mouseInteractive) return;
      event.preventDefault();
      const touch = event.touches[0];
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = (touch.clientX - rect.left) / rect.width;
      this.mouse.y = (touch.clientY - rect.top) / rect.height;
      this.material.uniforms.mouse.value.set(this.mouse.x, this.mouse.y);
    });
  }

  setupEventListeners() {
    this.resizeHandler = this.resize.bind(this);
    this.loopHandler = this.loop.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height);
    this.material.uniforms.resolution.value.set(rect.width, rect.height);
  }

  render() {
    const time = performance.now() * 0.001;
    this.material.uniforms.time.value = time;
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
      console.error('Error disposing plasma:', e);
    }
  }
}

// Export for use
window.Plasma = Plasma;