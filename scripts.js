document.addEventListener('DOMContentLoaded', () => {
    let currentPokemonId = 1;
    let keypadBuffer = '';
    let isLoading = false;

    // Referencias a elementos HTML
    const imgElement = document.getElementById('pokemon-img');
    const nameElement = document.getElementById('pkmn-name');
    const lcdNameElement = document.getElementById('lcd-name');
    const lcdIdElement = document.getElementById('lcd-id');
    const headIdElement = document.getElementById('pkmn-id-head');
    const typeElement = document.getElementById('pkmn-type');
    const heightElement = document.getElementById('pkmn-height');
    const weightElement = document.getElementById('pkmn-weight');
    const descElement = document.getElementById('pkmn-desc');
    const statusElement = document.getElementById('lcd-status');

    const hpElement = document.getElementById('stat-hp');
    const atkElement = document.getElementById('stat-atk');
    const defElement = document.getElementById('stat-def');

    const searchInput = document.getElementById('pokemon-search');
    const btnSearch = document.getElementById('btn-search');
    const btnReset = document.getElementById('btn-reset');
    
    // Botones de navegación
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');

    const numButtons = document.querySelectorAll('.num-btn');
    const btnClearKeypad = document.getElementById('btn-clear-keypad');

    // Función principal para consultar la PokeAPI
    async function fetchPokemon(identifier) {
        if (isLoading) return;
        isLoading = true;
        
        if (statusElement) statusElement.textContent = 'MODE: SEARCHING...';

        try {
            const query = identifier.toString().toLowerCase().trim();
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);
            
            if (!response.ok) {
                throw new Error('Pokémon no encontrado');
            }

            const data = await response.json();
            currentPokemonId = data.id;

            // Búsqueda de descripción en español
            let descriptionText = 'Sin descripción registrada.';
            try {
                const speciesRes = await fetch(data.species.url);
                if (speciesRes.ok) {
                    const speciesData = await speciesRes.json();
                    const entry = speciesData.flavor_text_entries.find(e => e.language.name === 'es');
                    if (entry) descriptionText = entry.flavor_text;
                }
            } catch (err) {
                console.warn('Error al obtener la descripción:', err);
            }

            renderPokemonData(data, descriptionText);
            if (statusElement) statusElement.textContent = 'MODE: ANALYZING';
        } catch (error) {
            alert('No se encontró el Pokémon solicitado.');
            if (statusElement) statusElement.textContent = 'MODE: ERROR';
        } finally {
            isLoading = false;
        }
    }

    // Renderizar datos en la interfaz
    function renderPokemonData(data, description) {
        const formattedId = String(data.id).padStart(3, '0');

        if (imgElement) {
            imgElement.src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default || '';
        }
        if (nameElement) nameElement.textContent = data.name.toUpperCase();
        if (lcdNameElement) lcdNameElement.textContent = data.name.toUpperCase();
        if (lcdIdElement) lcdIdElement.textContent = `#${formattedId}`;
        if (headIdElement) headIdElement.textContent = formattedId;

        if (typeElement) {
            typeElement.textContent = data.types.map(t => t.type.name.toUpperCase()).join(' / ');
        }
        if (heightElement) heightElement.textContent = `${(data.height / 10).toFixed(1)} m`;
        if (weightElement) weightElement.textContent = `${(data.weight / 10).toFixed(1)} kg`;
        if (descElement) descElement.textContent = description.replace(/[\n\f]/g, ' ');

        if (hpElement) hpElement.textContent = data.stats[0]?.base_stat || '--';
        if (atkElement) atkElement.textContent = data.stats[1]?.base_stat || '--';
        if (defElement) defElement.textContent = data.stats[2]?.base_stat || '--';
    }

    // Navegación siguiente / anterior
    function handleNext() {
        fetchPokemon(currentPokemonId + 1);
    }

    function handlePrev() {
        if (currentPokemonId > 1) {
            fetchPokemon(currentPokemonId - 1);
        }
    }

    // Asignación de listeners
    if (btnNext) btnNext.addEventListener('click', handleNext);
    if (btnPrev) btnPrev.addEventListener('click', handlePrev);

    if (dpadRight) dpadRight.addEventListener('click', handleNext);
    if (dpadDown) dpadDown.addEventListener('click', handleNext);
    if (dpadLeft) dpadLeft.addEventListener('click', handlePrev);
    if (dpadUp) dpadUp.addEventListener('click', handlePrev);

    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            const val = searchInput ? searchInput.value.trim() : '';
            if (val) fetchPokemon(val);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = searchInput.value.trim();
                if (val) fetchPokemon(val);
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            keypadBuffer = '';
            if (searchInput) searchInput.value = '';
            fetchPokemon(1);
        });
    }

    // Teclado Numérico Directo
    numButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const digit = btn.getAttribute('data-num');
            keypadBuffer += digit;
            if (searchInput) searchInput.value = keypadBuffer;
            fetchPokemon(keypadBuffer);
        });
    });

    if (btnClearKeypad) {
        btnClearKeypad.addEventListener('click', () => {
            keypadBuffer = '';
            if (searchInput) searchInput.value = '';
        });
    }

    // Carga inicial (Bulbasaur #1)
    fetchPokemon(currentPokemonId);
});