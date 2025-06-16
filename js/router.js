try { document.getElementById('debug-stage').textContent = 'STATUS: Router.js - Top Executed'; } catch(e){ console.error('Debug error:', e); }
const GITHUB_PAGES_BASE_PATH = '/Se-Liga';

const routes = {
    '/': 'pages/home_content.html',
    '/episodios': 'pages/episodios_content.html',
    '/sobre': 'pages/sobre_content.html',
    '/contato': 'pages/contato_content.html'
};

const appContent = document.getElementById('app-content');

async function loadContent(path) {
    const appContent = document.getElementById('app-content');
    if (!appContent) {
        console.error('Router: Elemento app-content não encontrado');
        return;
    }

    let targetPath = path;
    if (targetPath === '/') {
        targetPath = '/home';
    }

    const filePath = `${GITHUB_PAGES_BASE_PATH}/pages${targetPath}_content.html`;
    console.log(`Router: Carregando conteúdo de: ${filePath}`);

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Falha ao carregar conteúdo: ${response.status} ${response.statusText} para ${filePath}`);
        }
        
        const html = await response.text();
        if (!html || html.trim() === '') {
            throw new Error('Conteúdo retornado está vazio');
        }
        
        appContent.innerHTML = html;
        console.log(`Router: Conteúdo para "${targetPath}" carregado com sucesso.`);

        if (targetPath === '/home') {
            console.log('Router: Inicializando JavaScript específico da página inicial...');
            if (typeof window.initializeHomePage === 'function') {
                try {
                    window.initializeHomePage();
                    console.log('Router: initializeHomePage executado com sucesso');
                } catch (initError) {
                    console.error('Router: Erro ao executar initializeHomePage:', initError);
                }
            } else {
                console.warn('Router: Função initializeHomePage não encontrada');
            }
        }
    } catch (error) {
        console.error('Router: Erro ao carregar conteúdo para o caminho', path, error);
        appContent.innerHTML = `
            <div class="text-center p-8">
                <h1 class="text-4xl font-bold text-red-600 mb-4">Página Não Encontrada</h1>
                <p class="text-xl text-gray-700">Desculpe, a página que você está procurando não pôde ser carregada.</p>
                <p class="text-md text-gray-500 mt-2">Caminho tentado: ${path}</p>
                <a href="${GITHUB_PAGES_BASE_PATH}/" class="mt-6 inline-block bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 router-link">Ir para a Página Inicial</a>
            </div>
        `;
    }
}

function normalizePath(path) {
    // Remove base path if present
    if (path.startsWith(GITHUB_PAGES_BASE_PATH + '/')) {
        path = path.substring(GITHUB_PAGES_BASE_PATH.length);
    } else if (path === GITHUB_PAGES_BASE_PATH) {
         path = '/';
    }
    // Ensure it starts with a slash
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    // Remove index.html if present (often from direct access or old links)
    if (path.endsWith('/index.html')) {
        path = path.substring(0, path.length - 'index.html'.length);
        if (path === '') path = '/'; // if it was just /index.html
    }
    return path;
}

function navigateTo(path) {
    const normalizedPath = normalizePath(path); // Normalize for internal routing logic
    const fullDisplayPath = GITHUB_PAGES_BASE_PATH + (normalizedPath === '/' ? '' : normalizedPath); // Path for browser URL bar

    if (window.location.pathname !== fullDisplayPath || window.location.search !== '' || window.location.hash !== '') {
         // Only push state if the full display path (including base) is different,
         // or if there are query params/hash we want to clear for SPA routes.
         // For SPA routes, we generally don't want query params unless specifically handled.
        history.pushState({ path: normalizedPath }, '', fullDisplayPath);
    }
    loadContent(normalizedPath);
}

document.addEventListener('DOMContentLoaded', () => {
    try { document.getElementById("debug-stage").textContent = "STATUS: Router.js - DOMContentLoaded"; } catch(e){}
    if (!appContent) {
        console.error("#app-content not found on DOMContentLoaded. Router cannot initialize.");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const spaRedirectPath = params.get('spa_path');

    let initialLoadPath;

    if (spaRedirectPath) {
        console.log(`Router: Detected redirect from 404. Original intended SPA path: "${spaRedirectPath}"`);
        initialLoadPath = normalizePath(spaRedirectPath);
        // Clean the URL (remove ?spa_path=...)
        const cleanUrl = GITHUB_PAGES_BASE_PATH + (initialLoadPath === '/' ? '' : initialLoadPath) + window.location.hash;
        history.replaceState({ path: initialLoadPath }, '', cleanUrl);
    } else {
        initialLoadPath = normalizePath(window.location.pathname);
    }

    console.log(`Router: Initial load determined SPA path: "${initialLoadPath}"`);
    loadContent(routes[initialLoadPath] ? initialLoadPath : '/'); // Load content or default to home

    // Intercept clicks on router links (moved inside DOMContentLoaded to ensure appContent is available)
    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a');
        if (anchor) {
            const href = anchor.getAttribute('href');
            // Check if it's an internal link intended for the router
            // 1. Explicitly marked with 'router-link'
            // 2. Or, same origin, not a new tab, and href starts with GITHUB_PAGES_BASE_PATH or is root-relative
            //    and the path part (without base) is a defined route.
            const isRouterLinkClass = anchor.classList.contains('router-link');
            let isInternalEligibleLink = false;

            if (anchor.hostname === window.location.hostname && !anchor.getAttribute('target')) {
                if (href.startsWith(GITHUB_PAGES_BASE_PATH + '/') || href.startsWith('/')) {
                    let potentialSpaPath = href;
                    if (href.startsWith(GITHUB_PAGES_BASE_PATH + '/')) {
                        potentialSpaPath = href.substring(GITHUB_PAGES_BASE_PATH.length);
                        if (!potentialSpaPath.startsWith('/')) potentialSpaPath = '/' + potentialSpaPath;
                    }
                    if (routes[potentialSpaPath]) {
                        isInternalEligibleLink = true;
                    }
                }
            }

            if (isRouterLinkClass || isInternalEligibleLink) {
                event.preventDefault();
                // For hrefs like "/episodios", navigateTo handles prepending GITHUB_PAGES_BASE_PATH for history
                // but the path argument to navigateTo should be the SPA path e.g. "/episodios"
                let spaNavPath = href;
                if (href.startsWith(GITHUB_PAGES_BASE_PATH + '/')) {
                    spaNavPath = href.substring(GITHUB_PAGES_BASE_PATH.length);
                    if (!spaNavPath.startsWith('/')) spaNavPath = '/' + spaNavPath;
                }
                 if (spaNavPath === '' && href.startsWith(GITHUB_PAGES_BASE_PATH)) spaNavPath = '/';


                navigateTo(spaNavPath);
            }
        }
    });
});

window.addEventListener('popstate', (event) => {
    let pathFromPopstate = '/'; // Default
    if (event.state && event.state.path) {
        pathFromPopstate = event.state.path; // Path stored in history state (SPA path)
    } else {
        // Fallback if event.state is null (e.g. manual hash change or external navigation then back)
        pathFromPopstate = normalizePath(window.location.pathname);
    }
    console.log(`Router: popstate event, loading SPA path: "${pathFromPopstate}"`);
    loadContent(routes[pathFromPopstate] ? pathFromPopstate : '/');
});

console.log('Router initialized with GitHub Pages compatibility.');
