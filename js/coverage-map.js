// Histoire - Carte de couverture du réseau MLTC
// Reuses the same TopoJSON + Mercator approach as circulations.js
(function () {
    'use strict';

    const svgEl = document.querySelector('.cov-map');
    if (!svgEl) return;

    /* ---- Country data (ISO numeric → info) ---- */
    const COUNTRIES = new Map([
        [250, { name: 'France',        coverage: 0.85, group: 'fondateur', flag: '\u{1F1EB}\u{1F1F7}',
                desc: 'Coeur historique du réseau. La quasi-totalité du territoire est desservie par la MLTC, permise par un maillage dense avec des services à toute échelle.',
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Frail','Intracity'] }],
        [276, { name: 'Allemagne',     coverage: 0.75, group: 'fondateur', flag: '\u{1F1E9}\u{1F1EA}',
                desc: "Forte implantation, concentrée dans les régions de l'Ouest (ancien périmètre WME). L'Est, intégré plus tardivement, est moins densément couvert à l'échelle plus locale.",
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Urbahn','Intracity'] }],
        [56,  { name: 'Belgique',      coverage: 0.75, group: 'fondateur', flag: '\u{1F1E7}\u{1F1EA}',
                desc: 'Couverture dense héritée de la CCFM, particulièrement en Wallonie et autour de Bruxelles. Les services grandes lignes et régionaux sont largement assurés par la MLTC, tandis que les dessertes périurbaines restent majoritairement aux opérateurs locaux.',
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Intracity'] }],
        [528, { name: 'Pays-Bas',      coverage: 0.70, group: 'fondateur', flag: '\u{1F1F3}\u{1F1F1}',
                desc: 'Bonne couverture du réseau, notamment sur les grandes lignes et le régional. La plupart des services périurbains restent gérés par les opérateurs locaux.',
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Intracity'] }],
        [442, { name: 'Luxembourg',    coverage: 0.90, group: 'fondateur', flag: '\u{1F1F1}\u{1F1FA}',
                desc: 'Le réseau ferré du Luxemboourg est celui étant le plus intégré à la MLTC, qui y opère tous les services principaux.',
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Intracity'] }],
        [826, { name: 'Royaume-Uni',   coverage: 0.60, group: 'fondateur', flag: '\u{1F1EC}\u{1F1E7}',
                desc: "Présence concentrée dans l'Angleterre (héritage MSER). Une grande partie des services urbains restent opérés sous franchises locales, idem pour les services régionaux dans le nord.",
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Intracity'] }],
        [380, { name: 'Italie',        coverage: 0.55, group: 'fondateur', flag: '\u{1F1EE}\u{1F1F9}',
                desc: "Seul pays fondateur où la compagnie nationale est restée dominante. La MLTC y est implantée principalement sur les grandes lignes et quelques services régionaux, tandis que les lignes secondaires restent sous opérateurs locaux.",
                services: ['HSX','Xpress','TransRegio','Nocrail','Intracity'] }],
        [40,  { name: 'Autriche',      coverage: 0.65, group: 'expansion', flag: '\u{1F1E6}\u{1F1F9}',
                desc: 'Couverture étendue, sur les corridors internationaux comme sur les lignes intérieures.',
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Urbahn','Intracity'] }],
        [756, { name: 'Suisse',        coverage: 0.65, group: 'expansion', flag: '\u{1F1E8}\u{1F1ED}',
                desc: "Bonne couverture des lignes à écartement standard. Les lignes métriques (réseaux alpins) restent confiées aux opérateurs spécialisés.",
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Urbahn','Intracity'] }],
        [208, { name: 'Danemark',      coverage: 0.45, group: 'expansion', flag: '\u{1F1E9}\u{1F1F0}',
                desc: "Desserte de la partie sud du pays, du Schleswig jusqu'à Copenhague. Les lignes au nord restent sous l'opérateur national.",
                services: ['HSX','Xpress','Vivarail','Nocrail'] }],
        [203, { name: 'Tchéquie',      coverage: 0.40, group: 'expansion', flag: '\u{1F1E8}\u{1F1FF}',
                desc: "Implantation concentrée dans les régions de l'Ouest, principalement en Bohême. L'est du pays reste sous opérateurs locaux.",
                services: ['HSX','Xpress','TransRegio','Vivarail','Nocrail','Intracity'] }],
        [724, { name: 'Espagne',       coverage: 0.40, group: 'expansion', flag: '\u{1F1EA}\u{1F1F8}',
                desc: "Desserte concentrée au nord du pays, de la frontière française jusqu'à Madrid. Hormis un axe allant jusqu'à Séville, le sud reste majoritairement sous l'opérateur national.",
                services: ['HSX','Xpress','Vivarail','Nocrail'] }],
    ]);

    /* ---- Colour helpers ---- */
    // Interpolate between low-coverage colour and high-coverage colour
    function coverageColor(ratio) {
        // Light: from #ede9fe (very light violet) to #7c3aed (deep violet)
        // We'll use opacity on a solid violet instead for simplicity
        const minOp = 0.10, maxOp = 0.90;
        const op = minOp + ratio * (maxOp - minOp);
        return 'rgba(124, 58, 237, ' + op.toFixed(2) + ')';
    }

    /* ---- Tooltip ---- */
    const tooltip = document.getElementById('cov-tooltip');
    const ttFlag  = document.getElementById('cov-tt-flag');
    const ttName  = document.getElementById('cov-tt-name');
    const ttBar   = document.getElementById('cov-tt-bar');
    const ttDesc  = document.getElementById('cov-tt-desc');
    const ttSvc   = document.getElementById('cov-tt-services');
    const ttGroup = document.getElementById('cov-tt-group');

    let activeShape = null;

    function showTooltip(info, side) {
        ttFlag.textContent = info.flag || '';
        ttName.textContent = info.alias || info.name;
        ttBar.style.width  = (info.coverage * 100) + '%';
        ttDesc.textContent = info.desc;
        ttGroup.textContent = info.group === 'fondateur' ? 'Pays fondateur' : "Pays d'expansion";
        ttSvc.innerHTML = info.services.map(s =>
            '<span class="ht-svc-pill">' + s + '</span>').join('');
        tooltip.classList.toggle('cov-tt-left', side === 'left');
        tooltip.classList.add('visible');
    }

    function hideTooltip() {
        tooltip.classList.remove('visible');
        if (activeShape) {
            activeShape.classList.remove('cov-active');
            activeShape = null;
        }
    }

    /* ---- Map builder (same Mercator logic as circulations.js) ---- */
    const NS  = 'http://www.w3.org/2000/svg';
    const W   = 800, H = 650, PAD = 24;

    function mercY(lat) {
        const r = lat * Math.PI / 180;
        return Math.log(Math.tan(Math.PI / 4 + r / 2));
    }

    function europeanOnly(feature) {
        const inEurope = (ring) => {
            let sLon = 0, sLat = 0;
            ring.forEach(c => { sLon += c[0]; sLat += c[1]; });
            const aLon = sLon / ring.length, aLat = sLat / ring.length;
            return aLat > 34 && aLat < 65 && aLon > -12 && aLon < 25;
        };
        const g = feature.geometry;
        if (g.type === 'MultiPolygon') {
            const coords = g.coordinates.filter(poly => inEurope(poly[0]));
            if (!coords.length) return null;
            return { ...feature, geometry: { ...g, coordinates: coords } };
        }
        if (!inEurope(g.coordinates[0])) return null;
        return feature;
    }

    function geoBounds(features) {
        let minLon = Infinity, maxLon = -Infinity,
            minLat = Infinity, maxLat = -Infinity;
        const scan = coords => coords.forEach(([lon, lat]) => {
            if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
        });
        features.forEach(f => {
            const g = f.geometry;
            if (g.type === 'Polygon') g.coordinates.forEach(scan);
            else g.coordinates.forEach(p => p.forEach(scan));
        });
        return { minLon, maxLon, minLat, maxLat };
    }

    function fitProjection(bounds) {
        const { minLon, maxLon, minLat, maxLat } = bounds;
        const toR = Math.PI / 180;
        const myMin = mercY(minLat), myMax = mercY(maxLat);
        const geoW = (maxLon - minLon) * toR, geoH = myMax - myMin;
        const uw = W - 2 * PAD, uh = H - 2 * PAD;
        const s = Math.min(uw / geoW, uh / geoH);
        const mw = geoW * s, mh = geoH * s;
        const ox = PAD + (uw - mw) / 2, oy = PAD + (uh - mh) / 2;
        return (lon, lat) => [
            (lon * toR - minLon * toR) * s + ox,
            (myMax - mercY(lat)) * s + oy
        ];
    }

    function ringD(ring, proj) {
        return ring.map((c, i) => {
            const [x, y] = proj(c[0], c[1]);
            return (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
        }).join('') + 'Z';
    }

    function featureD(f, proj) {
        const g = f.geometry;
        const rings = g.type === 'MultiPolygon'
            ? g.coordinates.flatMap(p => p) : g.coordinates;
        return rings.map(r => ringD(r, proj)).join('');
    }

    async function buildMap() {
        const resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        if (!resp.ok) throw new Error('Carte : HTTP ' + resp.status);
        const world = await resp.json();
        const all = topojson.feature(world, world.objects.countries);

        let features = all.features
            .filter(f => COUNTRIES.has(Number(f.id)))
            .map(europeanOnly).filter(Boolean);

        const bounds = geoBounds(features);
        const proj   = fitProjection(bounds);
        svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

        features.forEach(f => {
            const info = COUNTRIES.get(Number(f.id));
            if (!info) return;

            const g = document.createElementNS(NS, 'g');
            g.classList.add('cov-country');
            g.dataset.country = info.name;

            const title = document.createElementNS(NS, 'title');
            title.textContent = info.alias || info.name;
            g.appendChild(title);

            const path = document.createElementNS(NS, 'path');
            path.classList.add('cov-shape');
            path.setAttribute('d', featureD(f, proj));
            path.style.fill = coverageColor(info.coverage);
            g.appendChild(path);

            svgEl.appendChild(g);
        });

        // Second pass: now that all paths are in the DOM, getBBox works
        svgEl.querySelectorAll('.cov-country').forEach(g => {
            const name = g.dataset.country;
            const info = [...COUNTRIES.values()].find(c => c.name === name);
            if (!info) return;

            const LEFT_COUNTRIES = new Set(['Italie', 'Autriche', 'Suisse']);
            let side = LEFT_COUNTRIES.has(name) ? 'left' : 'right';

            g.addEventListener('mouseenter', () => {
                if (activeShape && activeShape !== g) activeShape.classList.remove('cov-active');
                activeShape = g;
                g.classList.add('cov-active');
                showTooltip(info, side);
            });

            g.addEventListener('click', () => {
                if (activeShape && activeShape !== g) activeShape.classList.remove('cov-active');
                activeShape = g;
                g.classList.add('cov-active');
                showTooltip(info, side);
            });
        });

        // Click outside map → close tooltip
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cov-map-wrap')) hideTooltip();
        });


    }

    buildMap().catch(err => console.error('[CoverageMap]', err));
})();
