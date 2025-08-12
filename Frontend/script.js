const API_URL = '/api/auth'; // change if hosted elsewhere
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showMovieUI();
    fetchMovies();
  }
  
  setupStarRating();

  // Signup
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await signup();
    });
  }

  // Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await login();
    });
  }

  // Add movie
  const movieForm = document.getElementById('movieForm');
  if (movieForm) {
    movieForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const movie = Object.fromEntries(formData);

      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(movie)
      });

      if (res.ok) {
        e.target.reset();
        selectedRating = 0;
        updateStars();
        fetchMovies();
      } else {
        alert('Error adding movie');
      }
    });
  }
});

async function signup() {
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  if (!username || !email || !password) return alert('Please fill in all fields');

  const res = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Signup successful! Please log in.');
    window.location.href = '/login.html';
  } else {
    alert(data.message || 'Signup failed');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) return alert('Please fill in all fields');

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/index.html';
  } else {
    alert(data.message || 'Login failed');
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

function setupStarRating() {
  const stars = document.querySelectorAll('.stars span');
  stars.forEach(star => {
    star.addEventListener('mouseover', () => highlightStars(star.dataset.star));
    star.addEventListener('mouseout', () => highlightStars(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.star);
      document.getElementById('ratingInput').value = selectedRating;
      updateStars();
    });
  });
}

function highlightStars(rating) {
  document.querySelectorAll('.stars span').forEach(star => {
    star.classList.toggle('hovered', parseInt(star.dataset.star) <= rating);
  });
}

function updateStars() {
  document.querySelectorAll('.stars span').forEach(star => {
    star.classList.toggle('active', parseInt(star.dataset.star) <= selectedRating);
  });
}

async function fetchMovies() {
  const res = await fetch('/api/movies', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  const movies = await res.json();
  renderMovies(movies);
}

function renderMovies(movies) {
  const movieList = document.getElementById('movieList');
  movieList.innerHTML = '';
  movies.forEach(movie => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="movie-info">
        <span class="movie-title">${movie.title}</span>
        <span class="movie-meta">${movie.genre} | ${movie.actor} | ⭐ ${movie.rating}</span>
      </div>
    `;
    movieList.appendChild(li);
  });
}

function showMovieUI() {
  document.getElementById('movieForm').style.display = 'flex';
  document.getElementById('logoutBtn').style.display = 'inline-block';
}
