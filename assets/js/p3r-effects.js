/*
 * Persona 3 Reload - Pause Menu Effects
 * Irregular confetti, floating bubbles, text shimmer, wavy background,
 * P3R-style sidebar with diagonal nav, big background text, red triangle
 */

(function () {
	'use strict';

	// ── Configuration ──────────────────────────────────────────────
	var CONFIG = {
		confetti: {
			count: 40,
			// Mostly blues/cyans, with rare black, white, red
			colorPool: [
				// Blues & cyans (high weight)
				{ color: 'rgba(81, 238, 252, 0.5)', weight: 5 },
				{ color: 'rgba(18, 105, 204, 0.45)', weight: 5 },
				{ color: 'rgba(109, 154, 199, 0.4)', weight: 4 },
				{ color: 'rgba(40, 140, 220, 0.4)', weight: 4 },
				{ color: 'rgba(81, 238, 252, 0.3)', weight: 3 },
				// White (low weight)
				{ color: 'rgba(255, 255, 255, 0.35)', weight: 2 },
				// Black (low weight)
				{ color: 'rgba(0, 0, 0, 0.3)', weight: 1 },
				// Red (low weight)
				{ color: 'rgba(220, 30, 50, 0.4)', weight: 1 }
			],
			minSize: 3,
			maxSize: 22,
			minSpeed: 0.15,
			maxSpeed: 0.6,
			drift: 0.8
		},
		bubbles: {
			count: 14,
			minSize: 3,
			maxSize: 12,
			minSpeed: 0.3,
			maxSpeed: 0.7,
			drift: 0.6
		}
	};

	// ── Utility ────────────────────────────────────────────────────
	function rand(min, max) {
		return Math.random() * (max - min) + min;
	}

	function randInt(min, max) {
		return Math.floor(rand(min, max + 1));
	}

	// Weighted random color pick
	function pickColor() {
		var pool = CONFIG.confetti.colorPool;
		var totalWeight = 0;
		for (var i = 0; i < pool.length; i++) totalWeight += pool[i].weight;
		var r = Math.random() * totalWeight;
		var acc = 0;
		for (var j = 0; j < pool.length; j++) {
			acc += pool[j].weight;
			if (r <= acc) return pool[j].color;
		}
		return pool[0].color;
	}

	// ── Canvas Layer ───────────────────────────────────────────────
	var canvas, ctx;
	var particles = [];
	var bubbles = [];
	var W, H;

	function createCanvas() {
		canvas = document.createElement('canvas');
		canvas.id = 'p3r-effects-canvas';
		canvas.style.cssText =
			'position:fixed;top:0;left:0;width:100%;height:100%;' +
			'pointer-events:none;z-index:2;';
		document.body.appendChild(canvas);
		ctx = canvas.getContext('2d');
		resize();
		window.addEventListener('resize', resize);
	}

	function resize() {
		W = canvas.width = window.innerWidth;
		H = canvas.height = window.innerHeight;
	}

	// ── Confetti Particle ──────────────────────────────────────────
	// Irregular polygons: non-regular shapes, random size 40%-100% of maxSize,
	// slow and irregular floating with wobble

	function createConfettiParticle() {
		// Size: 40% to 100% of maxSize range for irregularity
		var sizeScale = rand(0.4, 1.0);
		var size = CONFIG.confetti.minSize + (CONFIG.confetti.maxSize - CONFIG.confetti.minSize) * sizeScale;
		var sides = randInt(3, 6);
		var color = pickColor();

		// Create irregular vertex radii (non-regular polygon)
		var radii = [];
		for (var i = 0; i < sides; i++) {
			radii.push(size * rand(0.5, 1.0)); // each vertex at different distance
		}

		return {
			x: rand(0, W),
			y: rand(H, H * 1.3),
			size: size,
			sides: sides,
			radii: radii,
			color: color,
			speed: rand(CONFIG.confetti.minSpeed, CONFIG.confetti.maxSpeed),
			drift: rand(-CONFIG.confetti.drift, CONFIG.confetti.drift),
			rotation: rand(0, Math.PI * 2),
			rotSpeed: rand(-0.008, 0.008),      // slower rotation
			phase: rand(0, Math.PI * 2),
			sineAmp: rand(10, 30),
			sineFreq: rand(0.002, 0.008),        // slower sine
			wobblePhase: rand(0, Math.PI * 2),
			wobbleAmp: rand(0.3, 1.5),           // irregular wobble
			wobbleFreq: rand(0.001, 0.004),
			opacity: rand(0.25, 0.7)
		};
	}

	function drawPolygon(p) {
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(p.rotation);
		ctx.globalAlpha = p.opacity;
		ctx.globalCompositeOperation = 'screen';
		ctx.beginPath();
		for (var i = 0; i < p.sides; i++) {
			var angle = (Math.PI * 2 / p.sides) * i - Math.PI / 2;
			var r = p.radii[i];
			var px = Math.cos(angle) * r;
			var py = Math.sin(angle) * r;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		}
		ctx.closePath();
		ctx.fillStyle = p.color;
		ctx.fill();
		ctx.restore();
	}

	function updateConfetti(p, time) {
		// Slow upward float with irregular wobble
		p.y -= p.speed;
		var wobble = Math.sin(time * p.wobbleFreq + p.wobblePhase) * p.wobbleAmp;
		p.x += Math.sin(time * p.sineFreq + p.phase) * p.drift * 0.15 + wobble * 0.05;
		p.rotation += p.rotSpeed;

		if (p.y < -p.size * 2) {
			p.y = H + p.size * 2;
			p.x = rand(0, W);
			p.opacity = rand(0.25, 0.7);
		}
	}

	// ── Bubble ─────────────────────────────────────────────────────

	function createBubble() {
		var size = rand(CONFIG.bubbles.minSize, CONFIG.bubbles.maxSize);
		return {
			x: rand(0, W),
			y: rand(H, H * 1.5),
			size: size,
			speed: rand(CONFIG.bubbles.minSpeed, CONFIG.bubbles.maxSpeed),
			phase: rand(0, Math.PI * 2),
			sineAmp: rand(20, 60),
			sineFreq: rand(0.002, 0.006),
			opacity: rand(0.08, 0.2),
			baseX: rand(0, W)
		};
	}

	function drawBubble(b, time) {
		var x = b.baseX + Math.sin(time * b.sineFreq + b.phase) * b.sineAmp;
		b.x = x;

		ctx.save();
		ctx.globalAlpha = b.opacity;
		ctx.globalCompositeOperation = 'screen';

		ctx.beginPath();
		ctx.arc(x, b.y, b.size, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(81, 238, 252, 0.4)';
		ctx.lineWidth = 1;
		ctx.stroke();

		var grad = ctx.createRadialGradient(x, b.y, 0, x, b.y, b.size);
		grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
		grad.addColorStop(0.5, 'rgba(81, 238, 252, 0.08)');
		grad.addColorStop(1, 'rgba(81, 238, 252, 0)');
		ctx.fillStyle = grad;
		ctx.fill();

		ctx.beginPath();
		ctx.arc(x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
		ctx.fill();

		ctx.restore();
	}

	function updateBubble(b) {
		b.y -= b.speed;
		if (b.y < -b.size * 2) {
			b.y = H + b.size * 2;
			b.baseX = rand(0, W);
			b.opacity = rand(0.08, 0.2);
			b.size = rand(CONFIG.bubbles.minSize, CONFIG.bubbles.maxSize);
		}
	}

	// ── Main Loop ──────────────────────────────────────────────────

	var startTime = Date.now();

	function animate() {
		var time = Date.now() - startTime;

		ctx.clearRect(0, 0, W, H);

		for (var i = 0; i < particles.length; i++) {
			updateConfetti(particles[i], time);
			drawPolygon(particles[i]);
		}

		for (var j = 0; j < bubbles.length; j++) {
			updateBubble(bubbles[j]);
			drawBubble(bubbles[j], time);
		}

		requestAnimationFrame(animate);
	}

	// ── Shimmer Effect on Headings ─────────────────────────────────

	function initShimmer() {
		var headings = document.querySelectorAll('h1, h2');
		for (var i = 0; i < headings.length; i++) {
			headings[i].classList.add('p3r-shimmer');
		}
	}

	// ── Wave Overlay ───────────────────────────────────────────────

	function createWaveOverlay() {
		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.id = 'p3r-waves';
		svg.setAttribute('viewBox', '0 0 1440 800');
		svg.setAttribute('preserveAspectRatio', 'none');
		svg.style.cssText =
			'position:fixed;top:0;left:0;width:100%;height:100%;' +
			'pointer-events:none;z-index:0;opacity:0.5;';

		var waves = [
			{ color: 'rgba(18, 105, 204, 0.15)', amplitude: 40, frequency: 1.5, speed: 0.0008, yOffset: 400 },
			{ color: 'rgba(81, 238, 252, 0.08)', amplitude: 30, frequency: 2, speed: 0.0012, yOffset: 500 },
			{ color: 'rgba(109, 154, 199, 0.1)', amplitude: 50, frequency: 1, speed: 0.0006, yOffset: 300 }
		];

		var paths = [];
		for (var i = 0; i < waves.length; i++) {
			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('fill', waves[i].color);
			svg.appendChild(path);
			paths.push({ el: path, config: waves[i] });
		}

		document.body.appendChild(svg);

		function animateWaves() {
			var t = Date.now();
			for (var i = 0; i < paths.length; i++) {
				var w = paths[i].config;
				var d = 'M0 800';
				for (var x = 0; x <= 1440; x += 10) {
					var y = w.yOffset +
						Math.sin(x * w.frequency * 0.005 + t * w.speed) * w.amplitude +
						Math.sin(x * w.frequency * 0.003 + t * w.speed * 0.7) * w.amplitude * 0.5;
					d += ' L' + x + ' ' + y;
				}
				d += ' L1440 800 Z';
				paths[i].el.setAttribute('d', d);
			}
			requestAnimationFrame(animateWaves);
		}
		animateWaves();
	}

	// ── Caustic Flares ─────────────────────────────────────────────

	function createCausticFlares() {
		var flareContainer = document.createElement('div');
		flareContainer.id = 'p3r-caustic-flares';
		flareContainer.style.cssText =
			'position:fixed;top:0;left:0;width:100%;height:100%;' +
			'pointer-events:none;z-index:1;overflow:hidden;';

		for (var i = 0; i < 5; i++) {
			var flare = document.createElement('div');
			flare.className = 'p3r-flare';
			var size = rand(150, 400);
			flare.style.cssText =
				'position:absolute;border-radius:50%;' +
				'width:' + size + 'px;height:' + size + 'px;' +
				'background:radial-gradient(ellipse,rgba(255,255,255,0.12) 0%,rgba(81,238,252,0.05) 40%,transparent 70%);' +
				'animation:p3r-flare-drift-' + (i % 3) + ' ' + rand(15, 30) + 's ease-in-out infinite;' +
				'animation-delay:' + rand(0, 10) + 's;' +
				'top:' + rand(-10, 90) + '%;' +
				'left:' + rand(-10, 90) + '%;' +
				'mix-blend-mode:screen;';
			flareContainer.appendChild(flare);
		}
		document.body.appendChild(flareContainer);
	}

	// ── P3R Sidebar ────────────────────────────────────────────────
	// Transform the sidebar: white bg, diagonal text, big background text,
	// red triangle on active item, active = black text + bigger

	function initP3RSidebar() {
		var sidebar = document.getElementById('sidebar');
		if (!sidebar) return;

		var navLinks = sidebar.querySelectorAll('nav a');
		if (navLinks.length === 0) return;

		// Create the big background text element
		var bgText = document.createElement('div');
		bgText.id = 'p3r-sidebar-bg-text';
		sidebar.appendChild(bgText);

		// Map section IDs to display names
		var sectionNames = {
			'#intro': 'WELCOME',
			'#one': 'TAKE YOUR TIME',
			'#three': 'GET IN TOUCH'
		};

		// Add random diagonal angles to each nav item
		var navItems = sidebar.querySelectorAll('nav > ul > li');
		var angles = [];
		for (var i = 0; i < navItems.length; i++) {
			var angle = rand(-6, 6); // random diagonal
			angles.push(angle);
			navItems[i].style.transform = 'rotate(' + angle + 'deg)';
			navItems[i].style.transformOrigin = 'right center';
		}

		// Function to update the active state P3R style
		function updateActiveState() {
			var activeLink = sidebar.querySelector('nav a.active');
			var activeHref = activeLink ? activeLink.getAttribute('href') : '#intro';
			var activeName = sectionNames[activeHref] || 'WELCOME';

			// Update background text
			bgText.textContent = activeName;

			// Update each nav link
			for (var i = 0; i < navLinks.length; i++) {
				var link = navLinks[i];
				var li = link.parentElement;

				if (link.classList.contains('active')) {
					li.classList.add('p3r-active-item');
					li.classList.remove('p3r-inactive-item');
				} else {
					li.classList.remove('p3r-active-item');
					li.classList.add('p3r-inactive-item');
				}
			}
		}

		// Watch for class changes on nav links
		var observer = new MutationObserver(function () {
			updateActiveState();
		});

		for (var j = 0; j < navLinks.length; j++) {
			observer.observe(navLinks[j], { attributes: true, attributeFilter: ['class'] });
		}

		// Initial state
		updateActiveState();
	}

	// ── Initialization ─────────────────────────────────────────────

	function init() {
		if (window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		createWaveOverlay();
		createCausticFlares();
		createCanvas();

		for (var i = 0; i < CONFIG.confetti.count; i++) {
			var p = createConfettiParticle();
			p.y = rand(0, H);
			particles.push(p);
		}

		for (var j = 0; j < CONFIG.bubbles.count; j++) {
			var b = createBubble();
			b.y = rand(0, H);
			bubbles.push(b);
		}

		animate();
		initShimmer();
		initP3RSidebar();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
