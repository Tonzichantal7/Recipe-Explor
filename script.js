// API Base URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchTabs = document.querySelectorAll('.search-tab');
const alphabetFilter = document.getElementById('alphabet-filter');
const regionFilter = document.getElementById('region-filter');
const lettersContainer = document.querySelector('.letters-container');
const regionsContainer = document.querySelector('.regions-container');
const searchSuggestions = document.getElementById('search-suggestions');
const randomBtn = document.getElementById('random-btn');
const favoritesBtn = document.getElementById('favorites-btn');
const toggleCategoriesBtn = document.getElementById('toggle-categories');
const categoriesContainer = document.getElementById('categories-container');
const resultsContainer = document.getElementById('results-container');
const resultsTitle = document.getElementById('results-title');
const viewButtons = document.querySelectorAll('.view-btn');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const recipeModal = document.getElementById('recipe-modal');
const modalContentContainer = document.getElementById('modal-content-container');
const closeBtn = document.querySelector('.close-btn');
const favoritesDrawer = document.getElementById('favorites-drawer');
const closeFavorites = document.getElementById('close-favorites');
const favoritesContainer = document.getElementById('favorites-container');
const footerRandom = document.getElementById('footer-random');
const footerFavorites = document.getElementById('footer-favorites');

// Spinners
const categoriesSpinner = document.getElementById('categories-spinner');
const resultsSpinner = document.getElementById('results-spinner');
const modalSpinner = document.getElementById('modal-spinner');

// State
let activeCategory = null;
let activeSearchType = 'name';
let activeLetter = null;
let activeRegion = null;
let currentPage = 1;
let currentSearchTerm = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentMeals = [];
let categoriesCollapsed = false;

// Regions list
const regions = [
    'American', 'British', 'Canadian', 'Chinese', 'Dutch', 'Egyptian', 'French', 
    'Greek', 'Indian', 'Irish', 'Italian', 'Jamaican', 'Japanese', 'Kenyan', 
    'Malaysian', 'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian', 
    'Spanish', 'Thai', 'Tunisian', 'Turkish', 'Vietnamese'
];

// Cooking times
const cookingTimes = {
    'Breakfast': '15-20 mins',
    'Starter': '20-30 mins',
    'Side': '15-25 mins',
    'Dessert': '30-45 mins',
    'Vegetarian': '25-35 mins',
    'Seafood': '20-30 mins',
    'Beef': '40-50 mins',
    'Chicken': '35-45 mins',
    'Lamb': '45-55 mins',
    'Pasta': '20-30 mins',
    'Pork': '40-50 mins',
    'Goat': '50-60 mins',
    'Vegan': '25-35 mins',
    'Miscellaneous': '30-40 mins'
};

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
searchInput.addEventListener('input', handleSearchInput);
randomBtn.addEventListener('click', getRandomMeal);
favoritesBtn.addEventListener('click', toggleFavorites);
toggleCategoriesBtn.addEventListener('click', toggleCategories);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === recipeModal) closeModal();
});
closeFavorites.addEventListener('click', toggleFavorites);
loadMoreBtn.addEventListener('click', loadMoreMeals);
footerRandom.addEventListener('click', (e) => {
    e.preventDefault();
    getRandomMeal();
});
footerFavorites.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFavorites();
});

// Initialize the app
async function init() {
    // Setup alphabet filter
    setupAlphabetFilter();
    
    // Setup region filter
    setupRegionFilter();

    // Setup search tabs
    setupSearchTabs();

    // Setup view toggle
    setupViewToggle();

    // Load categories
    await loadCategories();

    // Load featured meals
    await getFeaturedMeals();

    // Render favorites
    renderFavorites();
}

// Setup alphabet filter
function setupAlphabetFilter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < alphabet.length; i++) {
        const letter = alphabet[i];
        const letterElement = document.createElement('div');
        letterElement.classList.add('letter');
        letterElement.textContent = letter;
        letterElement.addEventListener('click', () => {
            filterByLetter(letter);
        });
        
        lettersContainer.appendChild(letterElement);
    }
}

// Setup region filter
function setupRegionFilter() {
    regions.forEach(region => {
        const regionBtn = document.createElement('button');
        regionBtn.classList.add('region-btn');
        regionBtn.textContent = region;
        regionBtn.addEventListener('click', () => {
            filterByRegion(region);
        });
        
        regionsContainer.appendChild(regionBtn);
    });
}

// Setup search tabs
function setupSearchTabs() {
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            searchTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update active search type
            activeSearchType = tab.dataset.type;
            
            // Show/hide appropriate filters
            alphabetFilter.classList.remove('active');
            regionFilter.classList.remove('active');
            searchInput.disabled = false;
            
            if (activeSearchType === 'letter') {
                alphabetFilter.classList.add('active');
                searchInput.placeholder = 'Browse recipes alphabetically...';
                searchInput.disabled = true;
            } else if (activeSearchType === 'region') {
                regionFilter.classList.add('active');
                searchInput.placeholder = 'Browse recipes by region...';
                searchInput.disabled = true;
            } else if (activeSearchType === 'name') {
                searchInput.placeholder = 'Enter recipe name...';
            } else {
                searchInput.placeholder = 'Enter ingredient...';
            }
        });
    });
}

//  view toggle
function setupViewToggle() {
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from buttons
            viewButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update view
            const viewType = btn.dataset.view;
            resultsContainer.className = `results-container ${viewType}-view`;
        });
    });
}

// Toggle categories section
function toggleCategories() {
    categoriesCollapsed = !categoriesCollapsed;
    
    if (categoriesCollapsed) {
        categoriesContainer.style.display = 'none';
        toggleCategoriesBtn.classList.add('collapsed');
    } else {
        categoriesContainer.style.display = 'flex';
        toggleCategoriesBtn.classList.remove('collapsed');
    }
}

// Load meal categories
async function loadCategories() {
    try {
        categoriesSpinner.style.display = 'block';
        const response = await fetch(`${API_BASE_URL}/categories.php`);
        const data = await response.json();
        
        if (data.categories) {
            renderCategories(data.categories);
        }
    } catch (error) {
        showError('Failed to load categories');
        console.error('Error loading categories:', error);
    } finally {
        categoriesSpinner.style.display = 'none';
    }
}

// Render categories
function renderCategories(categories) {
    categoriesContainer.innerHTML = '';

    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.classList.add('category-card');
        
        if (category.strCategory === activeCategory) {
            categoryElement.classList.add('active');
        }
        
        categoryElement.innerHTML = `
            <img src="${category.strCategoryThumb}" alt="${category.strCategory}">
            <div class="category-card-content">
                <h3>${category.strCategory}</h3>
            </div>
        `;
        
        categoryElement.addEventListener('click', () => {
            filterByCategory(category.strCategory);
        });
        
        categoriesContainer.appendChild(categoryElement);
    });
}

// Filter meals by category
async function filterByCategory(category) {
    if (activeCategory === category) {
        // Deselect category if already active
        activeCategory = null;
        await getFeaturedMeals();
    } else {
        activeCategory = category;
        try {
            resultsSpinner.style.display = 'block';
            resultsContainer.innerHTML = '';
            resultsTitle.textContent = `${category} Recipes`;
            
            const response = await fetch(`${API_BASE_URL}/filter.php?c=${category}`);
            const data = await response.json();
            
            if (data.meals) {
                currentMeals = data.meals;
                renderMeals(data.meals);
                
                // Show load more button if there are more than 8 meals
                if (data.meals.length > 8) {
                    loadMoreContainer.style.display = 'block';
                } else {
                    loadMoreContainer.style.display = 'none';
                }
            } else {
                showNoResults();
                loadMoreContainer.style.display = 'none';
            }
            
            // Update category cards
            document.querySelectorAll('.category-card').forEach(card => {
                card.classList.toggle('active', card.querySelector('h3').textContent === category);
            });
        } catch (error) {
            showError('Failed to load recipes');
            console.error('Error filtering by category:', error);
        } finally {
            resultsSpinner.style.display = 'none';
        }
    }
}

// Filter meals by first letter
async function filterByLetter(letter) {
    if (activeLetter === letter) {
        // Deselect letter if already active
        activeLetter = null;
        await getFeaturedMeals();
    } else {
        activeLetter = letter;
        try {
            resultsSpinner.style.display = 'block';
            resultsContainer.innerHTML = '';
            resultsTitle.textContent = `Recipes Starting With "${letter}"`;
            
            const response = await fetch(`${API_BASE_URL}/search.php?f=${letter.toLowerCase()}`);
            const data = await response.json();
            
            if (data.meals) {
                currentMeals = data.meals;
                renderMeals(data.meals);
                
                // Show load more button if there are more than 8 meals
                if (data.meals.length > 8) {
                    loadMoreContainer.style.display = 'block';
                } else {
                    loadMoreContainer.style.display = 'none';
                }
            } else {
                showNoResults();
                loadMoreContainer.style.display = 'none';
            }
            
            // Update letter elements
            document.querySelectorAll('.letter').forEach(l => {
                l.classList.toggle('active', l.textContent === letter);
            });
        } catch (error) {
            showError('Failed to load recipes');
            console.error('Error filtering by letter:', error);
        } finally {
            resultsSpinner.style.display = 'none';
        }
    }
}

// Filter meals by region
async function filterByRegion(region) {
    if (activeRegion === region) {
        // Deselect region if already active
        activeRegion = null;
        await getFeaturedMeals();
    } else {
        activeRegion = region;
        try {
            resultsSpinner.style.display = 'block';
            resultsContainer.innerHTML = '';
            resultsTitle.textContent = `${region} Recipes`;
            
            const response = await fetch(`${API_BASE_URL}/filter.php?a=${region}`);
            const data = await response.json();
            
            if (data.meals) {
                currentMeals = data.meals;
                renderMeals(data.meals);
                
                // Show load more button if there are more than 8 meals
                if (data.meals.length > 8) {
                    loadMoreContainer.style.display = 'block';
                } else {
                    loadMoreContainer.style.display = 'none';
                }
            } else {
                showNoResults();
                loadMoreContainer.style.display = 'none';
            }
            
            // Update region buttons
            document.querySelectorAll('.region-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent === region);
            });
        } catch (error) {
            showError('Failed to load recipes');
            console.error('Error filtering by region:', error);
        } finally {
            resultsSpinner.style.display = 'none';
        }
    }
}

// Get featured meals (random selection for homepage)
async function getFeaturedMeals() {
    try {
        resultsSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';
        resultsTitle.textContent = 'Featured Recipes';
        
        // Reset active states
        activeCategory = null;
        activeLetter = null;
        activeRegion = null;
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelectorAll('.letter').forEach(letter => {
            letter.classList.remove('active');
        });
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Get a few random meals for the featured section
        const meals = [];
        for (let i = 0; i < 8; i++) {
            const response = await fetch(`${API_BASE_URL}/random.php`);
            const data = await response.json();
            if (data.meals && data.meals[0]) {
                // Avoid duplicates
                if (!meals.some(meal => meal.idMeal === data.meals[0].idMeal)) {
                    meals.push(data.meals[0]);
                }
            }
        }
        
        currentMeals = meals;
        renderMeals(meals);
        loadMoreContainer.style.display = 'none';
    } catch (error) {
        showError('Failed to load featured recipes');
        console.error('Error loading featured meals:', error);
    } finally {
        resultsSpinner.style.display = 'none';
    }
}

// Handle search input for suggestions
async function handleSearchInput() {
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length < 2 || activeSearchType === 'letter' || activeSearchType === 'region') {
        searchSuggestions.style.display = 'none';
        return;
    }

    try {
        let endpoint;
        if (activeSearchType === 'name') {
            endpoint = `${API_BASE_URL}/search.php?s=${searchTerm}`;
        } else {
            endpoint = `${API_BASE_URL}/filter.php?i=${searchTerm}`;
        }
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
            // Display up to 5 suggestions
            const suggestions = data.meals.slice(0, 5);
            
            searchSuggestions.innerHTML = '';
            suggestions.forEach(meal => {
                const suggestionElement = document.createElement('div');
                suggestionElement.classList.add('search-suggestion');
                suggestionElement.innerHTML = `
                    <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}">
                    <span>${meal.strMeal}</span>
                `;
                
                suggestionElement.addEventListener('click', () => {
                    openRecipeModal(meal.idMeal);
                    searchSuggestions.style.display = 'none';
                });
                
                searchSuggestions.appendChild(suggestionElement);
            });
            
            searchSuggestions.style.display = 'block';
        } else {
            searchSuggestions.style.display = 'none';
        }
    } catch (error) {
        console.error('Error getting search suggestions:', error);
        searchSuggestions.style.display = 'none';
    }
}

// Handle search
async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm || activeSearchType === 'letter' || activeSearchType === 'region') return;

    currentSearchTerm = searchTerm;
    currentPage = 1;

    try {
        resultsSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';
        
        let endpoint;
        if (activeSearchType === 'name') {
            endpoint = `${API_BASE_URL}/search.php?s=${searchTerm}`;
            resultsTitle.textContent = `Search Results for "${searchTerm}"`;
        } else {
            endpoint = `${API_BASE_URL}/filter.php?i=${searchTerm}`;
            resultsTitle.textContent = `Recipes with "${searchTerm}"`;
        }
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        // Reset active states
        activeCategory = null;
        activeLetter = null;
        activeRegion = null;
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelectorAll('.letter').forEach(letter => {
            letter.classList.remove('active');
        });
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Hide suggestions
        searchSuggestions.style.display = 'none';
        
        if (data.meals) {
            currentMeals = data.meals;
            renderMeals(data.meals);
            
            // Show load more button if there are more than 8 meals
            if (data.meals.length > 8) {
                loadMoreContainer.style.display = 'block';
            } else {
                loadMoreContainer.style.display = 'none';
            }
        } else {
            showNoResults();
            loadMoreContainer.style.display = 'none';
        }
    } catch (error) {
        showError('Search failed');
        console.error('Error searching:', error);
    } finally {
        resultsSpinner.style.display = 'none';
    }
}

// Get a random meal
async function getRandomMeal() {
    try {
        resultsSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';
        resultsTitle.textContent = 'Random Recipe Suggestion';
        
        const response = await fetch(`${API_BASE_URL}/random.php`);
        const data = await response.json();
        
        // Reset active states
        activeCategory = null;
        activeLetter = null;
        activeRegion = null;
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelectorAll('.letter').forEach(letter => {
            letter.classList.remove('active');
        });
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (data.meals) {
            currentMeals = data.meals;
            renderMeals(data.meals);
            loadMoreContainer.style.display = 'none';
            
            // Automatically open the recipe details
            openRecipeModal(data.meals[0].idMeal);
        } else {
            showNoResults();
            loadMoreContainer.style.display = 'none';
        }
    } catch (error) {
        showError('Failed to get random recipe');
        console.error('Error getting random meal:', error);
    } finally {
        resultsSpinner.style.display = 'none';
    }
}

// Load more meals
function loadMoreMeals() {
    currentPage++;
    const startIndex = (currentPage - 1) * 8;
    const endIndex = startIndex + 8;

    if (startIndex < currentMeals.length) {
        const nextMeals = currentMeals.slice(startIndex, endIndex);
        renderMoreMeals(nextMeals);
        
        // Hide load more button if we've loaded all meals
        if (endIndex >= currentMeals.length) {
            loadMoreContainer.style.display = 'none';
        }
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// Render meals
function renderMeals(meals) {
    resultsContainer.innerHTML = '';

    // Only show the first 8 meals initially
    const displayMeals = meals.slice(0, 8);

    displayMeals.forEach(meal => {
        renderMealCard(meal);
    });
}

// Render more meals (for load more)
function renderMoreMeals(meals) {
    meals.forEach(meal => {
        renderMealCard(meal);
    });
}

// Get estimated cooking time based on category
function getEstimatedCookingTime(meal) {
    if (meal.strCategory && cookingTimes[meal.strCategory]) {
        return cookingTimes[meal.strCategory];
    }
    return '30-40 mins'; // Default time
}

// Render a single meal card
function renderMealCard(meal) {
    const isFavorite = favorites.some(fav => fav.idMeal === meal.idMeal);
    const cookingTime = getEstimatedCookingTime(meal);

    const mealCard = document.createElement('div');
    mealCard.classList.add('recipe-card');
    mealCard.dataset.id = meal.idMeal;

    mealCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="recipe-card-content">
            <h3>${meal.strMeal}</h3>
            <div class="recipe-card-tags">
                ${meal.strCategory ? `<span class="recipe-tag">${meal.strCategory}</span>` : ''}
                ${meal.strArea ? `<span class="recipe-tag">${meal.strArea}</span>` : ''}
            </div>
            <div class="recipe-time">
                <i class="fas fa-clock"></i> ${cookingTime}
            </div>
            <div class="recipe-card-actions">
                <button class="view-recipe-btn">
                    <i class="fas fa-eye"></i> View Recipe
                </button>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    mealCard.querySelector('.view-recipe-btn').addEventListener('click', () => {
        openRecipeModal(meal.idMeal);
    });

    mealCard.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(meal);
        e.currentTarget.classList.toggle('active');
    });

    resultsContainer.appendChild(mealCard);
}

// Open recipe modal
async function openRecipeModal(mealId) {
    try {
        recipeModal.style.display = 'block';
        modalContentContainer.innerHTML = '';
        modalSpinner.style.display = 'block';
        
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
            renderRecipeDetails(meal);
        } else {
            modalContentContainer.innerHTML = '<p class="error">Recipe details not found</p>';
        }
    } catch (error) {
        modalContentContainer.innerHTML = '<p class="error">Failed to load recipe details</p>';
        console.error('Error opening recipe modal:', error);
    } finally {
        modalSpinner.style.display = 'none';
    }
}

// Render recipe details in modal
function renderRecipeDetails(meal) {
    // Get ingredients and measurements
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim() !== '') {
            ingredients.push({
                name: ingredient,
                measure: measure || ''
            });
        }
    }

    // Format instructions
    let instructions = meal.strInstructions;
    if (instructions) {
        // Split by numbered steps or paragraphs
        instructions = instructions.split(/\r\n|\r|\n/).filter(step => step.trim() !== '');
    }

    const isFavorite = favorites.some(fav => fav.idMeal === meal.idMeal);
    const cookingTime = getEstimatedCookingTime(meal);

    modalContentContainer.innerHTML = `
        <div class="recipe-detail">
            <div class="recipe-detail-header">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-detail-img">
                <div>
                    <h2 class="recipe-detail-title">${meal.strMeal}</h2>
                    <div class="recipe-detail-meta">
                        ${meal.strCategory ? `
                            <div class="recipe-detail-meta-item">
                                <i class="fas fa-tag"></i> ${meal.strCategory}
                            </div>
                        ` : ''}
                        ${meal.strArea ? `
                            <div class="recipe-detail-meta-item">
                                <i class="fas fa-globe"></i> ${meal.strArea}
                            </div>
                        ` : ''}
                        <div class="recipe-detail-meta-item">
                            <i class="fas fa-clock"></i> ${cookingTime}
                        </div>
                    </div>
                    <div class="recipe-detail-tags">
                        <span class="recipe-tag">
                            <i class="fas fa-utensils"></i> Serves 4
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="recipe-detail-section">
                <h3>Ingredients</h3>
                <div class="ingredients-grid">
                    ${ingredients.map(ing => `
                        <div class="ingredient-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${ing.measure} ${ing.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="recipe-detail-section">
                <h3>Instructions</h3>
                <ol class="instructions-list">
                    ${Array.isArray(instructions) ? 
                        instructions.map(step => `<li>${step}</li>`).join('') : 
                        `<li>${instructions}</li>`
                    }
                </ol>
            </div>
            
            <div class="recipe-detail-actions">
                ${meal.strYoutube ? `
                    <a href="${meal.strYoutube}" target="_blank" class="recipe-action-btn youtube-btn">
                        <i class="fab fa-youtube"></i> Watch Video
                    </a>
                ` : ''}
                
                ${meal.strSource ? `
                    <a href="${meal.strSource}" target="_blank" class="recipe-action-btn source-btn">
                        <i class="fas fa-external-link-alt"></i> View Source
                    </a>
                ` : ''}
                
                <button class="recipe-action-btn favorite-action-btn ${isFavorite ? 'active' : ''}">
                    <i class="fas fa-heart"></i> ${isFavorite ? 'Saved' : 'Save Recipe'}
                </button>
            </div>
        </div>
    `;

    // Add event listener to favorite button in modal
    modalContentContainer.querySelector('.favorite-action-btn').addEventListener('click', (e) => {
        toggleFavorite(meal);
        e.currentTarget.classList.toggle('active');
        e.currentTarget.innerHTML = e.currentTarget.classList.contains('active') ? 
            '<i class="fas fa-heart"></i> Saved' : 
            '<i class="fas fa-heart"></i> Save Recipe';
        
        // Update the favorite button in the recipe card if visible
        const recipeCard = document.querySelector(`.recipe-card[data-id="${meal.idMeal}"]`);
        if (recipeCard) {
            const cardFavBtn = recipeCard.querySelector('.favorite-btn');
            cardFavBtn.classList.toggle('active');
        }
    });
}

// Close modal
function closeModal() {
    recipeModal.style.display = 'none';
}

// Toggle favorites drawer
function toggleFavorites() {
    // Check if user is authenticated
    const user = getCurrentUser();
    if (!user) {
        openAuthModal();
        return;
    }
    favoritesDrawer.classList.toggle('open');
}

// Toggle favorite status
function toggleFavorite(meal) {
    // Check if user is authenticated
    const user = getCurrentUser();
    if (!user) {
        showAuthError('Please login to add favorites');
        openAuthModal();
        return;
    }

    const index = favorites.findIndex(fav => fav.idMeal === meal.idMeal);

    if (index === -1) {
        // Add to favorites
        favorites.push({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            strCategory: meal.strCategory,
            strArea: meal.strArea
        });
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
    }

    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Update favorites drawer
    renderFavorites();
}

// Render favorites in drawer
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<p class="empty-favorites">No favorites yet. Click the heart icon on any recipe to add it here.</p>';
        return;
    }

    favoritesContainer.innerHTML = '';

    favorites.forEach(favorite => {
        const favoriteItem = document.createElement('div');
        favoriteItem.classList.add('favorite-item');
        
        favoriteItem.innerHTML = `
            <img src="${favorite.strMealThumb}" alt="${favorite.strMeal}">
            <div class="favorite-item-content">
                <h4>${favorite.strMeal}</h4>
                <div class="favorite-item-tags">
                    ${favorite.strCategory ? `<span class="recipe-tag">${favorite.strCategory}</span>` : ''}
                    ${favorite.strArea ? `<span class="recipe-tag">${favorite.strArea}</span>` : ''}
                </div>
            </div>
            <button class="remove-favorite">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listeners
        favoriteItem.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                openRecipeModal(favorite.idMeal);
            }
        });
        
        favoriteItem.querySelector('.remove-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(favorite);
        });
        
        favoritesContainer.appendChild(favoriteItem);
    });
}

// Show no results message
function showNoResults() {
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search"></i>
            <h3>No recipes found</h3>
            <p>Try a different search term or category</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    resultsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
        </div>
    `;
}

// Close search suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchSuggestions.style.display = 'none';
    }
});
