function sortResults() {
    const sortBy = document.getElementById('sortResults').value;

    if (activeTab === 'myCollection') {
        searchResults.sort((a, b) => {
            switch (sortBy) {
                case 'relevance':
                    return (b.relevanceScore || 0) - (a.relevanceScore || 0);
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'rating-high':
                    return (b.rating || 0) - (a.rating || 0);
                case 'rating-low':
                    return (a.rating || 0) - (b.rating || 0);
                default:
                    return 0;
            }
        });
        displaySearchResults();
    } else {
        // Sort OMDB results
        omdbResults.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                case 'title-desc':
                    return b.Title.localeCompare(a.Title);
                case 'oldest':
                case 'title-asc':
                    return a.Title.localeCompare(b.Title);
                case 'rating-high':
                    const ratingA = parseFloat(a.imdbRating) || 0;
                    const ratingB = parseFloat(b.imdbRating) || 0;
                    return ratingB - ratingA;
                case 'rating-low':
                    const ratingA2 = parseFloat(a.imdbRating) || 0;
                    const ratingB2 = parseFloat(b.imdbRating) || 0;
                    return ratingA2 - ratingB2;
                default:
                    return 0;
            }
        });
        displayOMDBResults();
    }
}

function performSearch() {
    const searchTerms = {
        main: document.getElementById('mainSearch').value.toLowerCase().trim(),
        title: document.getElementById('titleSearch').value.toLowerCase().trim(),
        actor: document.getElementById('actorSearch').value.toLowerCase().trim(),
        director: document.getElementById('directorSearch').value.toLowerCase().trim(),
        cast: document.getElementById('castSearch').value.toLowerCase().trim(),
        genre: document.getElementById('genreSearch').value,
        rating: document.getElementById('ratingSearch').value
    };

    // Check if any search criteria is provided
    const hasSearchCriteria = Object.values(searchTerms).some(term => term !== '');

    if (!hasSearchCriteria) {
        showWelcomeMessage();
        return;
    }

    showLoading(true);

    // Filter movies based on search criteria
    searchResults = allMovies.filter(movie => {
        // Main search (searches across all fields)
        if (searchTerms.main) {
            const searchableText = [
                movie.title,
                movie.actor,
                movie.director,
                movie.cast,
                movie.genre
            ].filter(Boolean).join(' ').toLowerCase();

            if (!searchableText.includes(searchTerms.main)) {
                return false;
            }
        }

        // Specific field searches
        if (searchTerms.title && !movie.title.toLowerCase().includes(searchTerms.title)) {
            return false;
        }

        if (searchTerms.actor && (!movie.actor || !movie.actor.toLowerCase().includes(searchTerms.actor))) {
            return false;
        }

        if (searchTerms.director && (!movie.director || !movie.director.toLowerCase().includes(searchTerms.director))) {
            return false;
        }

        if (searchTerms.cast && (!movie.cast || !movie.cast.toLowerCase().includes(searchTerms.cast))) {
            return false;
        }

        // Genre filter
        if (searchTerms.genre && movie.genre !== searchTerms.genre) {
            return false;
        }

        // Rating filter
        if (searchTerms.rating && (!movie.rating || movie.rating < parseInt(searchTerms.rating))) {
            return false;
        }

        return true;
    });

    // Calculate relevance scores for sorting
    if (searchTerms.main) {
        searchResults = searchResults.map(movie => ({
            ...movie,
            relevanceScore: calculateRelevanceScore(movie, searchTerms.main)
        }));
    }

    setTimeout(() => {
        showLoading(false);
        displaySearchResults();
        updateSearchStats();
        showResultsArea();
    }, 300);
}// Search page functionality
const MOVIES_API_URL = '/api/movies';
const OMDB_API_KEY = '28d4864'; // From your .env file
const OMDB_API_URL = 'https://www.omdbapi.com/';
let allMovies = [];
let searchResults = [];
let omdbResults = [];
let currentView = 'grid';
let currentUser = null;
let activeTab = 'myCollection'; // 'myCollection' or 'omdb'

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    initializeSearchPage();
});

async function initializeSearchPage() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    try {
        // Verify token
        const userResponse = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!userResponse.ok) {
            localStorage.removeItem('token');
            window.location.href = '/index.html';
            return;
        }

        currentUser = await userResponse.json();
        await loadMovies();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing search page:', error);
        window.location.href = '/index.html';
    }
}

async function loadMovies() {
    try {
        showLoading(true);
        const response = await fetch(MOVIES_API_URL, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            allMovies = await response.json();
            console.log(`Loaded ${allMovies.length} movies for searching`);
        } else {
            throw new Error('Failed to load movies');
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load your movie collection');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    // Tab switching
    document.getElementById('myCollectionTab').addEventListener('click', () => switchTab('myCollection'));
    document.getElementById('omdbSearchTab').addEventListener('click', () => switchTab('omdb'));

    // My Collection Search
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('showAllBtn').addEventListener('click', showAllMovies);

    // OMDB Search
    document.getElementById('omdbSearchBtn').addEventListener('click', performOMDBSearch);
    document.getElementById('clearOmdbBtn').addEventListener('click', clearOMDBSearch);

    // Sort results
    document.getElementById('sortResults').addEventListener('change', sortResults);

    // View toggle
    document.getElementById('gridViewBtn').addEventListener('click', () => switchView('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));

    // Logout
    document.getElementById('navLogoutBtn').addEventListener('click', logout);

    // Quick filters (only for my collection)
    document.querySelectorAll('.quick-filter').forEach(button => {
        button.addEventListener('click', (e) => {
            const genre = e.target.getAttribute('data-genre');
            const rating = e.target.getAttribute('data-rating');

            switchTab('myCollection');
            clearSearchForm();
            if (genre) {
                document.getElementById('genreSearch').value = genre;
            }
            if (rating) {
                document.getElementById('ratingSearch').value = rating;
            }
            performSearch();
        });
    });

    // Real-time search on main search box (my collection only)
    document.getElementById('mainSearch').addEventListener('input', debounce(() => {
        if (activeTab === 'myCollection') {
            performSearch();
        }
    }, 500));

    // OMDB search on enter
    document.getElementById('omdbQuery').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performOMDBSearch();
        }
    });

    // Enter key listeners for collection search
    const searchInputs = document.querySelectorAll('#myCollectionSearch .search-field input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    });
}

function switchTab(tab) {
    activeTab = tab;

    // Update tab buttons
    document.getElementById('myCollectionTab').classList.toggle('active', tab === 'myCollection');
    document.getElementById('omdbSearchTab').classList.toggle('active', tab === 'omdb');

    // Show/hide search forms
    document.getElementById('myCollectionSearch').style.display = tab === 'myCollection' ? 'block' : 'none';
    document.getElementById('omdbSearchForm').style.display = tab === 'omdb' ? 'block' : 'none';

    // Clear and reset results
    if (tab === 'myCollection') {
        showWelcomeMessage();
        hideResultsArea();
    } else {
        showOMDBWelcomeMessage();
        hideResultsArea();
    }
}

async function performOMDBSearch() {
    const query = document.getElementById('omdbQuery').value.trim();
    const year = document.getElementById('omdbYear').value.trim();
    const type = document.getElementById('omdbType').value;

    if (!query) {
        alert('Please enter a movie title to search');
        return;
    }

    showLoading(true);

    try {
        // Build API URL
        let apiUrl = `${OMDB_API_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`;

        if (year) {
            apiUrl += `&y=${year}`;
        }
        if (type) {
            apiUrl += `&type=${type}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.Response === 'True') {
            // Get detailed info for each movie
            omdbResults = await Promise.all(
                data.Search.slice(0, 10).map(async (movie) => {
                    try {
                        const detailResponse = await fetch(
                            `${OMDB_API_URL}?apikey=${OMDB_API_KEY}&i=${movie.imdbID}&plot=short`
                        );
                        const detailData = await detailResponse.json();
                        return detailData.Response === 'True' ? detailData : movie;
                    } catch (error) {
                        console.error('Error fetching movie details:', error);
                        return movie;
                    }
                })
            );

            displayOMDBResults();
            updateOMDBStats();
            showResultsArea();
        } else {
            omdbResults = [];
            showNoResults();
        }
    } catch (error) {
        console.error('OMDB search error:', error);
        showError('Failed to search OMDB database. Please try again.');
    } finally {
        showLoading(false);
    }
}

function displayOMDBResults() {
    const resultsContainer = document.getElementById('searchResults');

    if (omdbResults.length === 0) {
        showNoResults();
        return;
    }

    resultsContainer.className = `search-results ${currentView}-view`;
    resultsContainer.innerHTML = '';

    omdbResults.forEach((movie, index) => {
        const movieElement = createOMDBMovieElement(movie, index);
        resultsContainer.appendChild(movieElement);
    });
}

function createOMDBMovieElement(movie, index) {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie-card omdb-card';

    // Map OMDB data to our format
    const posterUrl = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';
    const imdbRating = movie.imdbRating && movie.imdbRating !== 'N/A' ?
        `⭐ ${movie.imdbRating}/10 IMDB` : '';
    const plot = movie.Plot && movie.Plot !== 'N/A' ? movie.Plot : '';

    if (currentView === 'list') {
        movieDiv.innerHTML = `
      <div class="movie-content">
        <div class="movie-main-info">
          <h3 class="movie-title">${escapeHtml(movie.Title)} ${movie.Year ? `(${movie.Year})` : ''}</h3>
          <div class="movie-meta">
            <span class="genre-badge">${escapeHtml(movie.Genre || 'Unknown')}</span>
            ${imdbRating ? `<span class="imdb-rating">${imdbRating}</span>` : ''}
          </div>
        </div>
        <div class="movie-details">
          ${movie.Director && movie.Director !== 'N/A' ? `<p><strong>Director:</strong> ${escapeHtml(movie.Director)}</p>` : ''}
          ${movie.Actors && movie.Actors !== 'N/A' ? `<p><strong>Starring:</strong> ${escapeHtml(movie.Actors)}</p>` : ''}
          ${plot ? `<p class="plot"><strong>Plot:</strong> ${escapeHtml(plot.substring(0, 150))}${plot.length > 150 ? '...' : ''}</p>` : ''}
        </div>
        <div class="movie-actions">
          <button onclick="addOMDBMovieToCollection(${index})" class="action-btn add">Add to Collection</button>
          <button onclick="viewOMDBDetails(${index})" class="action-btn details">View Details</button>
        </div>
      </div>
    `;
    } else {
        movieDiv.innerHTML = `
      <div class="movie-content">
        ${posterUrl ? `<img src="${posterUrl}" alt="${escapeHtml(movie.Title)}" class="movie-poster" />` :
            `<div class="no-poster">🎬</div>`}
        <h3 class="movie-title">${escapeHtml(movie.Title)}</h3>
        <div class="movie-year">${movie.Year || 'Unknown Year'}</div>
        <div class="movie-meta">
          <span class="genre-badge">${escapeHtml(movie.Genre || 'Unknown')}</span>
          ${imdbRating ? `<div class="imdb-rating">${imdbRating}</div>` : ''}
        </div>
        ${movie.Director && movie.Director !== 'N/A' ? `<p class="movie-director"><strong>Director:</strong> ${escapeHtml(movie.Director)}</p>` : ''}
        ${movie.Actors && movie.Actors !== 'N/A' ? `<p class="movie-actors"><strong>Starring:</strong> ${escapeHtml(movie.Actors.substring(0, 50))}${movie.Actors.length > 50 ? '...' : ''}</p>` : ''}
        ${plot ? `<p class="movie-plot">${escapeHtml(plot.substring(0, 100))}${plot.length > 100 ? '...' : ''}</p>` : ''}
        <div class="movie-actions">
          <button onclick="addOMDBMovieToCollection(${index})" class="action-btn add">Add to Collection</button>
          <button onclick="viewOMDBDetails(${index})" class="action-btn details">Details</button>
        </div>
      </div>
    `;
    }

    return movieDiv;
}

async function addOMDBMovieToCollection(index) {
    const omdbMovie = omdbResults[index];

    // Map OMDB data to our movie format
    const movieData = {
        title: omdbMovie.Title,
        genre: mapOMDBGenreToOurGenre(omdbMovie.Genre),
        actor: omdbMovie.Actors && omdbMovie.Actors !== 'N/A' ?
            omdbMovie.Actors.split(',')[0].trim() : '', // Take first actor
        director: omdbMovie.Director && omdbMovie.Director !== 'N/A' ? omdbMovie.Director : '',
        cast: omdbMovie.Actors && omdbMovie.Actors !== 'N/A' ? omdbMovie.Actors : '',
        poster: omdbMovie.Poster && omdbMovie.Poster !== 'N/A' ? omdbMovie.Poster : '',
        rating: 0 // User will need to rate it
    };

    try {
        const response = await fetch(MOVIES_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(movieData)
        });

        if (response.ok) {
            const newMovie = await response.json();
            allMovies.unshift(newMovie); // Add to beginning of array
            showTemporaryMessage(`"${movieData.title}" added to your collection!`, 'success');

            // Update button to show it's added
            const button = event.target;
            button.textContent = 'Added ✓';
            button.disabled = true;
            button.style.background = '#4CAF50';
        } else {
            const error = await response.json();
            alert(error.error || 'Error adding movie to collection');
        }
    } catch (error) {
        console.error('Add movie error:', error);
        alert('Network error. Please try again.');
    }
}

function viewOMDBDetails(index) {
    const movie = omdbResults[index];

    // Create a modal-like overlay with detailed movie info
    const modal = document.createElement('div');
    modal.className = 'movie-modal';
    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${escapeHtml(movie.Title)} ${movie.Year ? `(${movie.Year})` : ''}</h2>
        <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="modal-poster">
          ${movie.Poster && movie.Poster !== 'N/A' ?
        `<img src="${movie.Poster}" alt="${escapeHtml(movie.Title)}" />` :
        `<div class="no-poster-large">🎬</div>`}
        </div>
        <div class="modal-details">
          <p><strong>Genre:</strong> ${movie.Genre || 'Unknown'}</p>
          <p><strong>Director:</strong> ${movie.Director || 'Unknown'}</p>
          <p><strong>Starring:</strong> ${movie.Actors || 'Unknown'}</p>
          <p><strong>Runtime:</strong> ${movie.Runtime || 'Unknown'}</p>
          <p><strong>Released:</strong> ${movie.Released || 'Unknown'}</p>
          ${movie.imdbRating && movie.imdbRating !== 'N/A' ?
        `<p><strong>IMDB Rating:</strong> ${movie.imdbRating}/10</p>` : ''}
          ${movie.Plot && movie.Plot !== 'N/A' ?
        `<p><strong>Plot:</strong> ${movie.Plot}</p>` : ''}
        </div>
      </div>
      <div class="modal-actions">
        <button onclick="addOMDBMovieToCollection(${index})" class="action-btn add">Add to My Collection</button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="action-btn secondary">Close</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);
}

function mapOMDBGenreToOurGenre(omdbGenre) {
    if (!omdbGenre || omdbGenre === 'N/A') return 'Drama';

    const genres = omdbGenre.toLowerCase();

    if (genres.includes('action')) return 'Action';
    if (genres.includes('comedy')) return 'Comedy';
    if (genres.includes('romance')) return 'Rom-Com';
    if (genres.includes('drama')) return 'Drama';
    if (genres.includes('horror')) return 'Horror';
    if (genres.includes('thriller')) return 'Thriller';
    if (genres.includes('sci-fi') || genres.includes('science fiction')) return 'Sci-Fi';
    if (genres.includes('fantasy')) return 'Fantasy';

    return 'Drama'; // Default fallback
}

function clearOMDBSearch() {
    document.getElementById('omdbQuery').value = '';
    document.getElementById('omdbYear').value = '';
    document.getElementById('omdbType').value = '';
    omdbResults = [];
    showOMDBWelcomeMessage();
    hideResultsArea();
}

function updateOMDBStats() {
    const statsText = document.getElementById('searchStatsText');
    const resultCount = omdbResults.length;

    if (resultCount === 0) {
        statsText.innerHTML = `No results found in OMDB database`;
    } else {
        statsText.innerHTML = `Found <strong>${resultCount}</strong> movies in OMDB database`;
    }
}

function showOMDBWelcomeMessage() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
    <div class="welcome-message">
      <h2>🌐 Discover Movies from OMDB</h2>
      <p>Search millions of movies from the Open Movie Database and add them to your collection!</p>
      <p>Enter a movie title above to start discovering new films.</p>
      <div class="search-tips">
        <h3>💡 OMDB Search Tips:</h3>
        <ul>
          <li><strong>Be specific:</strong> Use the full movie title for best results</li>
          <li><strong>Add year:</strong> Include release year to narrow down results</li>
          <li><strong>Try variations:</strong> If you don't find it, try alternate titles</li>
          <li><strong>Browse results:</strong> Check multiple results for the right movie</li>
        </ul>
      </div>
    </div>
  `;
}
const searchTerms = {
    main: document.getElementById('mainSearch').value.toLowerCase().trim(),
    title: document.getElementById('titleSearch').value.toLowerCase().trim(),
    actor: document.getElementById('actorSearch').value.toLowerCase().trim(),
    director: document.getElementById('directorSearch').value.toLowerCase().trim(),
    cast: document.getElementById('castSearch').value.toLowerCase().trim(),
    genre: document.getElementById('genreSearch').value,
    rating: document.getElementById('ratingSearch').value
};

// Check if any search criteria is provided
const hasSearchCriteria = Object.values(searchTerms).some(term => term !== '');

if (!hasSearchCriteria) {
    showWelcomeMessage();
    return;
}

showLoading(true);

// Filter movies based on search criteria
searchResults = allMovies.filter(movie => {
    // Main search (searches across all fields)
    if (searchTerms.main) {
        const searchableText = [
            movie.title,
            movie.actor,
            movie.director,
            movie.cast,
            movie.genre
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchTerms.main)) {
            return false;
        }
    }

    // Specific field searches
    if (searchTerms.title && !movie.title.toLowerCase().includes(searchTerms.title)) {
        return false;
    }

    if (searchTerms.actor && (!movie.actor || !movie.actor.toLowerCase().includes(searchTerms.actor))) {
        return false;
    }

    if (searchTerms.director && (!movie.director || !movie.director.toLowerCase().includes(searchTerms.director))) {
        return false;
    }

    if (searchTerms.cast && (!movie.cast || !movie.cast.toLowerCase().includes(searchTerms.cast))) {
        return false;
    }

    // Genre filter
    if (searchTerms.genre && movie.genre !== searchTerms.genre) {
        return false;
    }

    // Rating filter
    if (searchTerms.rating && (!movie.rating || movie.rating < parseInt(searchTerms.rating))) {
        return false;
    }

    return true;
});

// Calculate relevance scores for sorting
if (searchTerms.main) {
    searchResults = searchResults.map(movie => ({
        ...movie,
        relevanceScore: calculateRelevanceScore(movie, searchTerms.main)
    }));
}

setTimeout(() => {
    showLoading(false);
    displaySearchResults();
    updateSearchStats();
    showResultsArea();
}, 300);
}

function calculateRelevanceScore(movie, searchTerm) {
    let score = 0;
    const term = searchTerm.toLowerCase();

    // Exact title match gets highest score
    if (movie.title.toLowerCase() === term) score += 100;
    else if (movie.title.toLowerCase().startsWith(term)) score += 50;
    else if (movie.title.toLowerCase().includes(term)) score += 25;

    // Actor matches
    if (movie.actor && movie.actor.toLowerCase().includes(term)) score += 20;

    // Director matches
    if (movie.director && movie.director.toLowerCase().includes(term)) score += 15;

    // Cast matches
    if (movie.cast && movie.cast.toLowerCase().includes(term)) score += 10;

    // Genre matches
    if (movie.genre.toLowerCase().includes(term)) score += 5;

    return score;
}

function displaySearchResults() {
    const resultsContainer = document.getElementById('searchResults');

    if (searchResults.length === 0) {
        showNoResults();
        return;
    }

    resultsContainer.className = `search-results ${currentView}-view`;
    resultsContainer.innerHTML = '';

    searchResults.forEach((movie, index) => {
        const movieElement = createMovieElement(movie, index);
        resultsContainer.appendChild(movieElement);
    });
}

function createMovieElement(movie, index) {
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie-card';

    if (currentView === 'list') {
        movieDiv.innerHTML = `
      <div class="movie-content">
        <div class="movie-main-info">
          <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
          <div class="movie-meta">
            <span class="genre-badge">${escapeHtml(movie.genre)}</span>
            ${movie.rating ? `<span class="rating">${'⭐'.repeat(movie.rating)} (${movie.rating}/5)</span>` : ''}
          </div>
        </div>
        <div class="movie-details">
          ${movie.actor ? `<p><strong>Actor:</strong> ${escapeHtml(movie.actor)}</p>` : ''}
          ${movie.director ? `<p><strong>Director:</strong> ${escapeHtml(movie.director)}</p>` : ''}
          ${movie.cast ? `<p><strong>Cast:</strong> ${escapeHtml(movie.cast)}</p>` : ''}
        </div>
        <div class="movie-actions">
          <button onclick="editMovie('${movie._id}', ${index})" class="action-btn edit">Edit</button>
          <button onclick="deleteMovie('${movie._id}', ${index})" class="action-btn delete">Delete</button>
        </div>
      </div>
    `;
    } else {
        movieDiv.innerHTML = `
      <div class="movie-content">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        <div class="movie-meta">
          <span class="genre-badge">${escapeHtml(movie.genre)}</span>
          ${movie.rating ? `<div class="rating">${'⭐'.repeat(movie.rating)} <span>(${movie.rating}/5)</span></div>` : ''}
        </div>
        ${movie.actor ? `<p class="movie-actor"><strong>Starring:</strong> ${escapeHtml(movie.actor)}</p>` : ''}
        ${movie.director ? `<p class="movie-director"><strong>Director:</strong> ${escapeHtml(movie.director)}</p>` : ''}
        ${movie.cast ? `<p class="movie-cast"><strong>Cast:</strong> ${escapeHtml(movie.cast)}</p>` : ''}
        <div class="movie-actions">
          <button onclick="editMovie('${movie._id}', ${index})" class="action-btn edit">Edit</button>
          <button onclick="deleteMovie('${movie._id}', ${index})" class="action-btn delete">Delete</button>
        </div>
      </div>
    `;
    }

    return movieDiv;
}

function sortResults() {
    const sortBy = document.getElementById('sortResults').value;

    searchResults.sort((a, b) => {
        switch (sortBy) {
            case 'relevance':
                return (b.relevanceScore || 0) - (a.relevanceScore || 0);
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'rating-high':
                return (b.rating || 0) - (a.rating || 0);
            case 'rating-low':
                return (a.rating || 0) - (b.rating || 0);
            default:
                return 0;
        }
    });

    displaySearchResults();
}

function switchView(view) {
    currentView = view;

    document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
    document.getElementById('listViewBtn').classList.toggle('active', view === 'list');

    displaySearchResults();
}

function clearSearch() {
    clearSearchForm();
    showWelcomeMessage();
    hideResultsArea();
}

function clearSearchForm() {
    document.getElementById('mainSearch').value = '';
    document.getElementById('titleSearch').value = '';
    document.getElementById('actorSearch').value = '';
    document.getElementById('directorSearch').value = '';
    document.getElementById('castSearch').value = '';
    document.getElementById('genreSearch').value = '';
    document.getElementById('ratingSearch').value = '';
    document.getElementById('sortResults').value = 'relevance';
}

function showAllMovies() {
    clearSearchForm();
    searchResults = [...allMovies];
    displaySearchResults();
    updateSearchStats();
    showResultsArea();
}

function updateSearchStats() {
    const statsText = document.getElementById('searchStatsText');
    const totalMovies = allMovies.length;
    const resultCount = searchResults.length;

    if (resultCount === 0) {
        statsText.innerHTML = `No results found in ${totalMovies} movies`;
    } else if (resultCount === totalMovies) {
        statsText.innerHTML = `Showing all <strong>${totalMovies}</strong> movies in your collection`;
    } else {
        const percentage = ((resultCount / totalMovies) * 100).toFixed(1);
        statsText.innerHTML = `Found <strong>${resultCount}</strong> of ${totalMovies} movies (${percentage}%)`;
    }
}

function showWelcomeMessage() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
    <div class="welcome-message">
      <h2>🎬 Welcome to Advanced Search</h2>
      <p>Use the search form above to find specific movies in your collection.</p>
      <p>You have <strong>${allMovies.length}</strong> movies ready to search!</p>
      <div class="search-tips">
        <h3>💡 Search Tips:</h3>
        <ul>
          <li><strong>Quick Search:</strong> Use the main search box to search everything at once</li>
          <li><strong>Specific Search:</strong> Use individual fields for precise results</li>
          <li><strong>Combine Filters:</strong> Mix text search with genre and rating filters</li>
          <li><strong>Quick Filters:</strong> Click the quick filter buttons for instant results</li>
        </ul>
      </div>
    </div>
  `;
}

function showNoResults() {
    document.getElementById('noResults').style.display = 'block';
    document.getElementById('searchResults').innerHTML = '';
}

function hideNoResults() {
    document.getElementById('noResults').style.display = 'none';
}

function showResultsArea() {
    document.getElementById('searchStats').style.display = 'block';
    document.getElementById('sortContainer').style.display = 'block';
    hideNoResults();
}

function hideResultsArea() {
    document.getElementById('searchStats').style.display = 'none';
    document.getElementById('sortContainer').style.display = 'none';
    hideNoResults();
}

function showLoading(show) {
    document.getElementById('searchLoading').style.display = show ? 'block' : 'none';
}

function showError(message) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
    <div class="error-message">
      <h2>❌ Error</h2>
      <p>${message}</p>
      <button onclick="location.reload()" class="retry-btn">Try Again</button>
    </div>
  `;
}

// Movie actions
async function editMovie(movieId, index) {
    const movie = searchResults[index];
    const newTitle = prompt('Edit movie title:', movie.title);

    if (newTitle === null || newTitle.trim() === '') {
        return;
    }

    try {
        const response = await fetch(`${MOVIES_API_URL}/${movieId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title: newTitle.trim() })
        });

        if (response.ok) {
            const updatedMovie = await response.json();
            searchResults[index] = updatedMovie;

            // Update in all movies array too
            const allMoviesIndex = allMovies.findIndex(m => m._id === movieId);
            if (allMoviesIndex !== -1) {
                allMovies[allMoviesIndex] = updatedMovie;
            }

            displaySearchResults();
            showTemporaryMessage('Movie updated successfully', 'success');
        } else {
            const error = await response.json();
            alert(error.error || 'Error updating movie');
        }
    } catch (error) {
        console.error('Update movie error:', error);
        alert('Network error. Please try again.');
    }
}

async function deleteMovie(movieId, index) {
    if (!confirm('Are you sure you want to delete this movie?')) {
        return;
    }

    try {
        const response = await fetch(`${MOVIES_API_URL}/${movieId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            // Remove from search results
            searchResults.splice(index, 1);

            // Remove from all movies array
            const allMoviesIndex = allMovies.findIndex(m => m._id === movieId);
            if (allMoviesIndex !== -1) {
                allMovies.splice(allMoviesIndex, 1);
            }

            displaySearchResults();
            updateSearchStats();
            showTemporaryMessage('Movie deleted successfully', 'success');
        } else {
            const error = await response.json();
            alert(error.error || 'Error deleting movie');
        }
    } catch (error) {
        console.error('Delete movie error:', error);
        alert('Network error. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, function(m) { return map[m]; }) : '';
}

function showTemporaryMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.className = `temporary-message ${type}`;
    messageEl.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 1000;
    padding: 15px 20px;
    border-radius: 8px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
    background: ${type === 'success' ? 'linear-gradient(45deg, #51cf66, #40c057)' : 'linear-gradient(45deg, #ff6b6b, #ee5a52)'};
    color: white;
  `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}