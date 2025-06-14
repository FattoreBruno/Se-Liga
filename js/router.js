// --- Router Implementation ---
const routes = {
    '/': 'pages/home_content.html',
    '/episodios': 'pages/episodios_content.html',
    '/sobre': 'pages/sobre_content.html',
    '/contato': 'pages/contato_content.html'
    // Add more routes as needed
};

const appContent = document.getElementById('app-content');

async function loadContent(path) {
    if (!appContent) {
        console.error('#app-content element not found.');
        return;
    }

    // Default to home if path is not recognized or empty
    const filePath = routes[path] || routes['/'];
    const effectivePath = routes[path] ? path : '/'; // Store the path that was actually loaded

    console.log(`Loading content for path: ${effectivePath}, from file: ${filePath}`);

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            // If specific path failed, try loading home as a fallback before showing generic 404
            if (path !== '/') {
                console.warn(`Failed to load ${filePath} for path ${path}. Trying to load home page.`);
                // Update history to reflect that we are showing home page instead of a broken link
                history.replaceState({ path: '/' }, '', '/');
                loadContent('/'); // Load home page
                return;
            }
            throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        appContent.innerHTML = html;
        console.log(`Content for ${effectivePath} loaded successfully.`);

        // Call specific initialization for home page content
        if (effectivePath === '/') {
            if (window.initializeHomePage) {
                console.log('Initializing home page specific JavaScript...');
                window.initializeHomePage();
            } else {
                console.warn('initializeHomePage function not found on window.');
            }
        }
        // Add similar checks for other pages if they need specific JS initialization later

    } catch (error) {
        console.error('Error loading content:', error);
        appContent.innerHTML = `
            <div class="text-center p-8">
                <h1 class="text-4xl font-bold text-red-600 mb-4">Error</h1>
                <p class="text-xl text-gray-700">Could not load page content.</p>
                <p class="text-md text-gray-500 mt-2">${error.message}</p>
                <a href="/" class="mt-6 inline-block bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 router-link">Go to Homepage</a>
            </div>
        `;
    }
}

function navigateTo(path) {
    // Only push state if the path is different from the current one
    if (window.location.pathname !== path) {
        history.pushState({ path: path }, '', path);
    }
    loadContent(path);
}

// Handle initial page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure #app-content exists before trying to load content
    if (appContent) {
        const initialPath = window.location.pathname;
        console.log(`Initial load, path: ${initialPath}`);
        // Ensure a valid route is loaded, default to '/'
        if (routes[initialPath]) {
            loadContent(initialPath);
        } else {
            console.warn(`Initial path ${initialPath} not in routes. Loading default /.`);
            history.replaceState({ path: '/' }, '', '/'); // Update history to reflect default load
            loadContent('/');
        }
    } else {
        console.error("#app-content not found on DOMContentLoaded. Router cannot initialize.");
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
    // event.state might be null if the user navigated to a #hash or an external page then came back
    const path = event.state && event.state.path ? event.state.path : window.location.pathname;
    console.log(`popstate event, path: ${path}`);
    loadContent(path);
});

// Intercept clicks on router links
document.addEventListener('click', (event) => {
    // Find the closest ancestor anchor tag, if the click was on a child element.
    const anchor = event.target.closest('a');

    if (anchor && anchor.classList.contains('router-link')) { // Check for a specific class or attribute
        event.preventDefault(); // Prevent full page reload
        const path = anchor.getAttribute('href');
        if (path) {
            navigateTo(path);
        }
    } else if (anchor && anchor.hostname === window.location.hostname && !anchor.getAttribute('target')) {
        // Handle internal links that don't have the 'router-link' class but are on the same domain
        // and don't open in a new tab.
        const path = anchor.pathname + anchor.search + anchor.hash;
        // Check if this path is one of our SPA routes
        if (routes[anchor.pathname]) { // Only checking anchor.pathname for routes match
            event.preventDefault();
            navigateTo(anchor.pathname); // Use anchor.pathname for routing
        }
        // If not a SPA route, let the browser handle it (e.g. link to a PDF or an external site if hostname check was removed)
    }
});

console.log('Router initialized.');
