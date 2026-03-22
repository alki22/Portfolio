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
		// Predefined angles: Welcome mild, Take Your Time very irregular, Get In Touch moderate
		var navItems = sidebar.querySelectorAll('nav > ul > li');
		var presetAngles = [
			rand(-8, -3),    // Welcome: mild tilt
			rand(12, 20),    // Take Your Time: strong irregular tilt
			rand(-15, -6)    // Get In Touch: moderate opposite tilt
		];
		for (var i = 0; i < navItems.length; i++) {
			var angle = i < presetAngles.length ? presetAngles[i] : rand(-20, 20);
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

	// ── P3R Spotlight Treatment ─────────────────────────────────────
	// Apply irregular rotations to spotlight headings and descriptions

	function initSpotlightTreatment() {
		var spotlightInners = document.querySelectorAll('.spotlights > section > .content > .inner');

		for (var i = 0; i < spotlightInners.length; i++) {
			var inner = spotlightInners[i];

			// Keep heading with no rotation
			var h2 = inner.querySelector('h2');
			if (h2) {
				h2.style.transform = 'none';
			}

			// Rotate description paragraphs slightly
			var paragraphs = inner.querySelectorAll('p');
			for (var j = 0; j < paragraphs.length; j++) {
				var pAngle = rand(-3, 3);
				paragraphs[j].style.transform = 'rotate(' + pAngle + 'deg)';
				paragraphs[j].style.transformOrigin = 'left center';
			}

			// Rotate the wave button slightly
			var waveBtn = inner.querySelector('.p3r-wave-btn');
			if (waveBtn) {
				var bAngle = rand(-3, 3);
				waveBtn.style.transform = 'rotate(' + bAngle + 'deg)';
				waveBtn.style.transformOrigin = 'left center';
			}
		}
	}

	// ── P3R Subpage Header Treatment ───────────────────────────
	// Apply P3R styling to subpage headers: rotations on nav items,
	// big cyan background text matching the page title

	function initSubpageHeader() {
		var header = document.getElementById('header');
		if (!header) return;

		// Add rotations to nav items
		var navItems = header.querySelectorAll('nav > ul > li');
		var headerAngles = [rand(-6, -2), rand(3, 8), rand(-10, -4), rand(2, 7)];
		for (var i = 0; i < navItems.length; i++) {
			var angle = i < headerAngles.length ? headerAngles[i] : rand(-8, 8);
			navItems[i].style.transform = 'rotate(' + angle + 'deg)';
			navItems[i].style.transformOrigin = 'center center';
		}

		// Create large cyan background title text
		var h1 = document.querySelector('#main h1.alt, section.wrapper h1.alt');
		if (h1) {
			var titleText = h1.textContent;
			// Shorten long titles for the bg text
			var shortTitles = {
				'academic experience': 'ACADEMIA',
				'my time at the industry': 'INDUSTRY',
				'interests and passions': 'INTERESTS'
			};
			var lower = titleText.toLowerCase().trim();
			if (shortTitles[lower]) titleText = shortTitles[lower];

			var bgTitle = document.createElement('div');
			bgTitle.className = 'p3r-subpage-bg-title';
			bgTitle.textContent = titleText;
			document.body.appendChild(bgTitle);
		}
	}

	// ── Page Transition (Wave/Water) ───────────────────────────
	// Three transition directions:
	//   - bottom-up: main page → subpage
	//   - horizontal: subpage → subpage
	//   - top-down: any → home/main page

	function initPageTransition() {
		var isOnMainPage = !!document.getElementById('sidebar');

		// Create the transition overlay
		var overlay = document.createElement('div');
		overlay.id = 'p3r-page-transition';
		overlay.innerHTML =
			'<svg viewBox="0 0 1440 900" preserveAspectRatio="none" style="width:100%;height:100%;position:absolute;top:0;left:0;">' +
				'<path id="p3r-wave-path-1" fill="rgba(18, 105, 204, 0.95)"></path>' +
				'<path id="p3r-wave-path-2" fill="rgba(10, 22, 40, 0.9)"></path>' +
				'<path id="p3r-wave-path-3" fill="#1269cc"></path>' +
			'</svg>';
		overlay.style.cssText =
			'position:fixed;top:0;left:0;width:100%;height:100%;' +
			'z-index:99999;pointer-events:none;' +
			'transform:translateY(100%);';
		document.body.appendChild(overlay);

		var isTransitioning = false;

		// ── Vertical wave paths (bottom-up or top-down) ──
		function animateVerticalWaves(progress, fromTop) {
			for (var w = 1; w <= 3; w++) {
				var path = document.getElementById('p3r-wave-path-' + w);
				if (!path) continue;

				var offset = (w - 1) * 40;
				var amp = 30 + w * 10;
				var freq = 0.008 + w * 0.002;
				var speed = Date.now() * 0.003;

				var d, baseY;
				if (fromTop) {
					// Top-down: wave edge descends from top
					baseY = 900 * progress;
					d = 'M0 0';
					for (var x = 0; x <= 1440; x += 10) {
						var y = baseY - offset +
							Math.sin(x * freq + speed) * amp +
							Math.sin(x * freq * 0.5 + speed * 1.3) * amp * 0.5;
						d += ' L' + x + ' ' + y;
					}
					d += ' L1440 0 Z';
				} else {
					// Bottom-up: wave edge rises from bottom
					baseY = 900 * (1 - progress);
					d = 'M0 900';
					for (var x2 = 0; x2 <= 1440; x2 += 10) {
						var y2 = baseY + offset +
							Math.sin(x2 * freq + speed) * amp +
							Math.sin(x2 * freq * 0.5 + speed * 1.3) * amp * 0.5;
						d += ' L' + x2 + ' ' + y2;
					}
					d += ' L1440 900 Z';
				}
				path.setAttribute('d', d);
			}
		}

		// ── Horizontal wave paths (left-to-right) ──
		function animateHorizontalWaves(progress) {
			for (var w = 1; w <= 3; w++) {
				var path = document.getElementById('p3r-wave-path-' + w);
				if (!path) continue;

				var offset = (w - 1) * 30;
				var amp = 25 + w * 8;
				var freq = 0.01 + w * 0.003;
				var speed = Date.now() * 0.003;

				// Wave edge sweeps from left to right
				var baseX = 1440 * progress;
				var d = 'M0 0';
				d += ' L0 900';
				for (var y = 900; y >= 0; y -= 10) {
					var x = baseX - offset +
						Math.sin(y * freq + speed) * amp +
						Math.sin(y * freq * 0.5 + speed * 1.3) * amp * 0.5;
					d += ' L' + x + ' ' + y;
				}
				d += ' Z';
				path.setAttribute('d', d);
			}
		}

		// ── Horizontal wave paths (right-to-left) ──
		function animateHorizontalWavesRTL(progress) {
			for (var w = 1; w <= 3; w++) {
				var path = document.getElementById('p3r-wave-path-' + w);
				if (!path) continue;

				var offset = (w - 1) * 30;
				var amp = 25 + w * 8;
				var freq = 0.01 + w * 0.003;
				var speed = Date.now() * 0.003;

				// Wave edge sweeps from right to left
				var baseX = 1440 * (1 - progress);
				var d = 'M1440 0';
				d += ' L1440 900';
				for (var y = 900; y >= 0; y -= 10) {
					var x = baseX + offset +
						Math.sin(y * freq + speed) * amp +
						Math.sin(y * freq * 0.5 + speed * 1.3) * amp * 0.5;
					d += ' L' + x + ' ' + y;
				}
				d += ' Z';
				path.setAttribute('d', d);
			}
		}

		// Page order for determining horizontal direction
		var pageOrder = { 'academia.html': 0, 'industry.html': 1, 'hobbies.html': 2 };

		function getPageIndex(href) {
			for (var key in pageOrder) {
				if (href.indexOf(key) !== -1) return pageOrder[key];
			}
			return -1;
		}

		var currentPageIndex = getPageIndex(window.location.pathname);

		// Determine transition direction based on destination
		function getDirection(href) {
			var isGoingHome = href === 'index.html' || href === '/' || href === './' ||
				href.indexOf('index.html') !== -1;
			if (isGoingHome) return 'top-down';
			if (!isOnMainPage) {
				// subpage → subpage: check page order for direction
				var destIndex = getPageIndex(href);
				if (destIndex < currentPageIndex) return 'horizontal-rtl';
				return 'horizontal';
			}
			return 'bottom-up';  // main → subpage
		}

		// ── Transition out: wave covers the page ──
		function transitionOut(href, direction) {
			if (isTransitioning) return;
			isTransitioning = true;
			overlay.style.pointerEvents = 'all';
			overlay.style.transform = 'translate(0, 0)';

			var start = Date.now();
			var duration = 600;

			function step() {
				var elapsed = Date.now() - start;
				var progress = Math.min(elapsed / duration, 1);
				var eased = progress * progress;

				if (direction === 'horizontal') {
					animateHorizontalWaves(eased);
				} else if (direction === 'horizontal-rtl') {
					animateHorizontalWavesRTL(eased);
				} else {
					animateVerticalWaves(eased, direction === 'top-down');
				}

				if (progress < 1) {
					requestAnimationFrame(step);
				} else {
					window.location.href = href;
				}
			}
			step();
		}

		// ── Transition in: wave recedes and "drags" the new page into view ──
		// Uses a fixed-position curtain that slides with the wave to create the
		// illusion of the page being dragged in, without transforming page content
		// (which would break scroll position on long pages).
		function transitionIn(direction) {
			overlay.style.transform = 'translate(0, 0)';
			window.scrollTo(0, 0);

			// Hide subpage images during transition to prevent flash
			var mainImage = document.querySelector('#main .image.fit');
			if (mainImage) {
				mainImage.style.opacity = '0';
				mainImage.style.transition = 'none';
			}

			// Create a solid curtain behind the wave that matches the page bg
			// As the wave recedes, this curtain slides away revealing content underneath
			var curtain = document.createElement('div');
			curtain.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99998;pointer-events:none;';
			curtain.style.background = '#1269cc';
			document.body.appendChild(curtain);

			// Create gradient blend at the leading edge for seamless transition
			var blend = document.createElement('div');
			blend.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99997;pointer-events:none;';
			document.body.appendChild(blend);

			if (direction === 'bottom-up') {
				blend.style.background = 'linear-gradient(to bottom, transparent 50%, #1269cc 90%)';
			} else if (direction === 'top-down') {
				blend.style.background = 'linear-gradient(to top, transparent 50%, #1269cc 90%)';
			} else if (direction === 'horizontal-rtl') {
				blend.style.background = 'linear-gradient(to right, transparent 50%, #1269cc 90%)';
			} else {
				blend.style.background = 'linear-gradient(to left, transparent 50%, #1269cc 90%)';
			}

			var start = Date.now();
			var duration = 700;

			function step() {
				var elapsed = Date.now() - start;
				var progress = Math.min(elapsed / duration, 1);
				var eased = 1 - (1 - progress) * (1 - progress);

				// Slide the curtain away slightly behind the wave so it never
				// reveals content before the wave edge has passed (prevents image flash)
				var curtainLag = Math.max(0, eased - 0.08);
				if (direction === 'bottom-up') {
					curtain.style.transform = 'translateY(' + (curtainLag * 100) + '%)';
					blend.style.transform = 'translateY(' + (curtainLag * 100) + '%)';
				} else if (direction === 'top-down') {
					curtain.style.transform = 'translateY(' + (-curtainLag * 100) + '%)';
					blend.style.transform = 'translateY(' + (-curtainLag * 100) + '%)';
				} else if (direction === 'horizontal-rtl') {
					curtain.style.transform = 'translateX(' + (-curtainLag * 100) + '%)';
					blend.style.transform = 'translateX(' + (-curtainLag * 100) + '%)';
				} else {
					curtain.style.transform = 'translateX(' + (curtainLag * 100) + '%)';
					blend.style.transform = 'translateX(' + (curtainLag * 100) + '%)';
				}

				// Fade out the blend as it reveals content
				blend.style.opacity = (1 - eased * 0.5).toString();

				// Move the wave overlay away
				if (direction === 'horizontal') {
					animateHorizontalWaves(1 - eased);
					overlay.style.transform = 'translateX(' + (eased * 100) + '%)';
				} else if (direction === 'horizontal-rtl') {
					animateHorizontalWavesRTL(1 - eased);
					overlay.style.transform = 'translateX(' + (-eased * 100) + '%)';
				} else if (direction === 'top-down') {
					animateVerticalWaves(1 - eased, true);
					overlay.style.transform = 'translateY(' + (-eased * 100) + '%)';
				} else {
					animateVerticalWaves(1 - eased, false);
					overlay.style.transform = 'translateY(' + (eased * 100) + '%)';
				}

				if (progress < 1) {
					requestAnimationFrame(step);
				} else {
					curtain.remove();
					blend.remove();
					overlay.style.pointerEvents = 'none';
					isTransitioning = false;

					// Fade in the subpage image after transition completes
					if (mainImage) {
						mainImage.style.transition = 'opacity 0.3s ease';
						mainImage.style.opacity = '1';
					}
				}
			}
			step();
		}

		// Intercept navigation links
		document.addEventListener('click', function (e) {
			var link = e.target.closest('a[href]');
			if (!link) return;

			var href = link.getAttribute('href');

			// Skip hash links, external links, javascript:, mailto:
			if (!href ||
				href.charAt(0) === '#' ||
				href.indexOf('://') !== -1 ||
				href.indexOf('javascript:') === 0 ||
				href.indexOf('mailto:') === 0) {
				return;
			}

			if (link.hostname && link.hostname !== window.location.hostname) return;

			e.preventDefault();
			var direction = getDirection(href);
			sessionStorage.setItem('p3r-transition-dir', direction);
			transitionOut(href, direction);
		});

		// Play entrance animation if arriving from a transition
		var savedDir = sessionStorage.getItem('p3r-transition-dir');
		if (savedDir) {
			sessionStorage.removeItem('p3r-transition-dir');
			transitionIn(savedDir);
		}
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
		initSpotlightTreatment();
		initSubpageHeader();
		initPageTransition();

		// Fallback: IntersectionObserver to activate spotlights with scroll-snap
		// (Scrollex's scroll-based detection can miss snap jumps)
		if ('IntersectionObserver' in window) {
			var spotlightSections = document.querySelectorAll('.spotlights > section');
			if (spotlightSections.length) {
				var observer = new IntersectionObserver(function(entries) {
					entries.forEach(function(entry) {
						if (entry.isIntersecting) {
							entry.target.classList.remove('inactive');
						}
					});
				}, { threshold: 0.2 });
				spotlightSections.forEach(function(section) {
					observer.observe(section);
				});
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
