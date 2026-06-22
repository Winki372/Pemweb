const pokedexGrid = document.getElementById('pokedex-grid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('search-input');
const tabButtons = document.querySelectorAll('.tab-btn');
const modal = document.getElementById('detail-modal');
const closeModalBtn = document.querySelector('.close-btn');
const modalBody = document.getElementById('modal-body');

let currentPokemonList = [];
let globalPokemonList = [];

const genConfig = {
    1: { limit: 151, offset: 0 },
    2: { limit: 100, offset: 151 },
    3: { limit: 135, offset: 251 },
    4: { limit: 107, offset: 386 },
    5: { limit: 156, offset: 493 }
};

async function fetchGeneration(genNum) {
    loading.classList.remove('hidden');
    pokedexGrid.innerHTML = '';
    
    const { limit, offset } = genConfig[genNum];
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const data = await response.json();
        currentPokemonList = data.results.map(p => {
            const id = p.url.split('/')[6];
            return { name: p.name, id: id, url: p.url };
        });
        displayPokemon(currentPokemonList);
    } catch (error) {
        pokedexGrid.innerHTML = '<p class="loading-spinner">Gagal memuat data dari API public.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

async function initGlobalData() {
    try {
        // Menarik batas data yang masuk akal (sekitar 1000+ pokemon utama)
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        globalPokemonList = data.results.map(p => {
            const id = p.url.split('/')[6];
            return { name: p.name, id: id, url: p.url };
        });
    } catch (error) {
        console.error("Gagal memuat database global");
    }
}

function displayPokemon(list) {
    pokedexGrid.innerHTML = '';
    if (list.length === 0) {
        pokedexGrid.innerHTML = '<p class="loading-spinner">Pokémon tidak ditemukan.</p>';
        return;
    }

    list.forEach(pokemon => {
        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openPokemonDetail(pokemon.id);
        
        card.innerHTML = `
            <div class="card-img-container">
                <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
            </div>
            <span class="card-id">#${pokemon.id.padStart(3, '0')}</span>
            <h3 class="card-name">${pokemon.name.replace('-', ' ')}</h3>
        `;
        pokedexGrid.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    // Jika input kosong, kembalikan tampilan ke generasi yang sedang aktif
    if (query.length === 0) {
        const activeGen = document.querySelector('.tab-btn.active').dataset.gen;
        fetchGeneration(activeGen);
        return;
    }

    // Jika tidak kosong, filter dari daftar GLOBAL, bukan daftar generasi saat ini
    const filtered = globalPokemonList.filter(p =>
    p.name.includes(query) || p.id.toString() === query
    );

    // Batasi hasil render maksimal 50 agar DOM/browser tidak lag saat pengguna mengetik "a"
    displayPokemon(filtered.slice(0, 20));
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        tabButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        searchInput.value = '';
        fetchGeneration(e.target.dataset.gen);
    });
});

async function openPokemonDetail(id) {
    modal.classList.remove('hidden');
    modalBody.innerHTML = '<p class="loading-spinner">Mengambil data detail...</p>';
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();
        
        const primaryType = data.types[0].type.name;
        const heightM = data.height / 10;
        const weightKg = data.weight / 10;
        const imageUrl = data.sprites.other['official-artwork'].front_default;

        let typesHtml = '';
        data.types.forEach(t => {
            typesHtml += `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`;
        });

        let statsHtml = '';
        data.stats.forEach(s => {
            const percentage = Math.min((s.base_stat / 150) * 100, 100);
            statsHtml += `
                <div class="stat-row">
                    <span class="stat-name">${s.stat.name.replace('-', ' ')}</span>
                    <div class="stat-bar-bg">
                        <div class="stat-bar-fill type-${primaryType}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="stat-value">${s.base_stat}</span>
                </div>
            `;
        });

        modalBody.innerHTML = `
            <div class="modal-header-bg bg-${primaryType}">
                <img src="${imageUrl}" alt="${data.name}">
            </div>
            <div class="modal-details">
                <h2 class="modal-name">${data.name.replace('-', ' ')}</h2>
                <div class="modal-types">${typesHtml}</div>
                <div class="modal-wh">
                    <div>
                        <div class="wh-title">Tinggi</div>
                        <div class="wh-value">${heightM} m</div>
                    </div>
                    <div>
                        <div class="wh-title">Berat</div>
                        <div class="wh-value">${weightKg} kg</div>
                    </div>
                </div>
                <div class="stats-container">
                    ${statsHtml}
                </div>
            </div>
        `;
    } catch (error) {
        modalBody.innerHTML = '<p class="loading-spinner">Gagal memuat detail Pokémon.</p>';
    }
}

closeModalBtn.onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };

fetchGeneration(1);
initGlobalData();
