let currentPokemonId = 1;
let allPokemonList = [];
let keypadInput = "";

const REGIONS = [
    { name: "KANTO", start: 1, end: 151 },
    { name: "JOHTO", start: 152, end: 251 },
    { name: "HOENN", start: 252, end: 386 },
    { name: "SINNOH", start: 387, end: 493 },
    { name: "UNOVA", start: 494, end: 649 },
    { name: "KALOS", start: 650, end: 721 },
    { name: "ALOLA", start: 722, end: 809 },
    { name: "GALAR", start: 810, end: 905 },
    { name: "PALDEA", start: 906, end: 1025 }
];

const getEl = id => document.getElementById(id);
const pad = n => String(n).padStart(4, '0');
const getRegion = id => REGIONS.find(r => id >= r.start && id <= r.end) || { name: "NATIONAL", start: 1, end: 1025 };

async function initPokedex() {
    setupEventListeners();
    try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const data = await res.json();
        
        allPokemonList = data.results.map((p, i) => ({
            id: i + 1,
            name: p.name,
            sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i + 1}.png`
        }));

        await selectPokemon(currentPokemonId);
    } catch (e) {
        console.error("Error al inicializar la Pokédex:", e);
    }
}

function renderCatalog(pokemonList, regionName) {
    const list = getEl('catalog-list');
    if (!list) return;
    list.innerHTML = '';

    const reg = getRegion(currentPokemonId);
    getEl('catalog-title').textContent = `CATÁLOGO REGIONAL (${regionName || reg.name} #${pad(reg.start)} - #${pad(reg.end)})`;
    getEl('catalog-count').textContent = `${pokemonList.length} ESPECÍMENES`;

    pokemonList.forEach(p => {
        const item = document.createElement('div');
        item.className = `catalog-item d-flex align-items-center justify-content-between${p.id === currentPokemonId ? ' active' : ''}`;
        item.dataset.id = p.id;
        item.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <div class="catalog-item-img-wrap d-flex align-items-center justify-content-center rounded-1">
                    <img class="catalog-item-img" src="${p.sprite}" alt="${p.name}">
                </div>
                <span class="catalog-item-id fw-bold">#${pad(p.id)}</span>
                <span class="catalog-item-name fw-bold">${p.name}</span>
            </div>
        `;
        item.onclick = () => selectPokemon(p.id);
        list.appendChild(item);
    });

    highlightActive(currentPokemonId);
}

function renderRegionCatalog(id) {
    const reg = getRegion(id);
    const regionPokemon = allPokemonList.filter(p => p.id >= reg.start && p.id <= reg.end);
    renderCatalog(regionPokemon, reg.name);
}

async function selectPokemon(id) {
    if (id < 1 || id > 1025) return;

    const prevReg = getRegion(currentPokemonId);
    const newReg = getRegion(id);
    currentPokemonId = id;

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await res.json();
        const specRes = await fetch(data.species.url);
        const specData = await specRes.json();

        // Actualización panel izquierdo
        getEl('pokemon-id-display').textContent = `ID: #${pad(id)} • ${data.name.toUpperCase()}`;
        getEl('pokemon-image').src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
        getEl('btn-prev').textContent = `< #${id > 1 ? pad(id - 1) : '0000'} PREV`;
        getEl('btn-next').textContent = `NEXT #${id < 1025 ? pad(id + 1) : '1026'} >`;

        // Actualización detalles panel derecho
        getEl('detail-name').textContent = `#${pad(id)} ${data.name.toUpperCase()}`;
        getEl('header-region-tag').textContent = `${newReg.name} OS • HANDY909`;
        getEl('desc-header').textContent = `🛡️ REGISTRO OFICIAL ${newReg.name}:`;

        const typesContainer = getEl('type-container');
        typesContainer.innerHTML = '';
        data.types.forEach(t => {
            typesContainer.innerHTML += `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`;
        });

        const genusObj = specData.genera.find(g => g.language.name === 'es') || specData.genera.find(g => g.language.name === 'en');
        getEl('detail-category').textContent = genusObj ? genusObj.genus : 'Pokémon';
        getEl('detail-height').textContent = `${(data.height / 10).toFixed(1)} m`;
        getEl('detail-weight').textContent = `${(data.weight / 10).toFixed(1)} kg`;

        const flavObj = specData.flavor_text_entries.find(f => f.language.name === 'es') || specData.flavor_text_entries.find(f => f.language.name === 'en');
        getEl('detail-description').textContent = `"${flavObj ? flavObj.flavor_text.replace(/[\n\f]/g, ' ') : 'Sin información.'}"`;

        const getStat = name => (data.stats.find(s => s.stat.name === name) || {}).base_stat || 0;
        
        ['hp', 'attack', 'defense', 'speed'].forEach((stat, idx) => {
            const key = ['hp', 'atk', 'def', 'speed'][idx];
            const val = getStat(stat);
            getEl(`val-${key}`).textContent = val;
            getEl(`bar-${key}`).style.width = `${Math.min((val / 180) * 100, 100)}%`;
        });

        if (prevReg.name !== newReg.name || !getEl('catalog-list').children.length) {
            renderRegionCatalog(id);
        } else {
            highlightActive(id);
        }
    } catch (e) {
        console.error("Error al cargar los datos del Pokémon:", e);
    }
}

function highlightActive(id) {
    document.querySelectorAll('.catalog-item').forEach(item => {
        const isActive = parseInt(item.dataset.id) === id;
        item.classList.toggle('active', isActive);
        if (isActive) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

function handleSearch() {
    const query = getEl('search-input').value.toLowerCase().trim();
    if (!query) return;

    const matched = allPokemonList.find(p => p.name.toLowerCase() === query || p.id.toString() === query) ||
                    allPokemonList.find(p => p.name.toLowerCase().includes(query));

    if (matched) {
        selectPokemon(matched.id);
    }
}

function setupEventListeners() {
    getEl('btn-prev').onclick = () => selectPokemon(currentPokemonId - 1);
    getEl('btn-next').onclick = () => selectPokemon(currentPokemonId + 1);
    getEl('dpad-left').onclick = () => selectPokemon(currentPokemonId - 1);
    getEl('dpad-right').onclick = () => selectPokemon(currentPokemonId + 1);

    document.querySelectorAll('.btn-num').forEach(btn => {
        btn.onclick = () => {
            if (keypadInput.length < 4) {
                keypadInput += btn.dataset.val;
                getEl('keypad-display').textContent = keypadInput;
            }
        };
    });

    getEl('btn-clear').onclick = () => {
        keypadInput = "";
        getEl('keypad-display').textContent = "---";
    };

    getEl('btn-enter').onclick = () => {
        const targetId = parseInt(keypadInput, 10);
        if (targetId >= 1 && targetId <= 1025) {
            selectPokemon(targetId);
        }
        keypadInput = "";
        getEl('keypad-display').textContent = "---";
    };

    const searchInput = getEl('search-input');
    searchInput.onkeydown = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };
    
    document.querySelector('.search-btn-icon').onclick = handleSearch;

    getEl('btn-reset').onclick = () => {
        searchInput.value = '';
        selectPokemon(1);
    };

    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.onclick = async () => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.type;
            if (type === 'all') {
                renderRegionCatalog(currentPokemonId);
            } else {
                const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
                const typeData = await res.json();
                const ids = typeData.pokemon
                    .map(p => parseInt(p.pokemon.url.split('/').filter(Boolean).pop()))
                    .filter(id => id <= 1025);

                const filteredList = allPokemonList.filter(p => ids.includes(p.id));
                renderCatalog(filteredList, 'FILTRADO');
            }
        };
    });
}

document.addEventListener('DOMContentLoaded', initPokedex);