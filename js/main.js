const RSS_URL = 'https://anchor.fm/s/105d2ac84/podcast/rss';

// Main Player DOM Elements
let globalAudioPlayer;
let playPauseBtn, playPauseIcon;
let rewindBtn, forwardBtn;
let progressBarContainer, progressBarFill;
let currentTimeDisplay, totalDurationDisplay;

// Mini Player DOM Elements
let miniPlayerDiv;
let miniPlayerTitle;
let miniPlayerPlayPauseBtn, miniPlayerPlayPauseIcon;
let miniPlayerRewindBtn, miniPlayerForwardBtn;
let miniPlayerCurrentTime, miniPlayerTotalDuration;
let miniPlayerProgressBarContainer, miniPlayerProgressFill;
let miniPlayerCloseBtn;

// Header Player DOM Elements
let headerPlayerPlayPauseButton;
let headerPlayerPlayPauseIcon;
let headerPlayerProgressFill;
let headerPlayerProgressContainer;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main.js DOMContentLoaded: Initializing shell components.');
    if (typeof initializePlayerDOMReferences === 'function') {
        initializePlayerDOMReferences();
    }
});

window.initializeHomePage = function() {
    console.log('initializeHomePage called from router.');
    if (typeof initializePlayerDOMReferences === 'function') {
        initializePlayerDOMReferences();
    } else {
        console.error('initializePlayerDOMReferences function is not defined when trying to init home page.');
    }
    if (typeof fetchRSSFeed === 'function') {
        fetchRSSFeed();
    } else {
        console.error('fetchRSSFeed function is not defined when trying to init home page.');
    }
};

function initializePlayerDOMReferences() {
    globalAudioPlayer = document.getElementById('global-audio-player');
    playPauseBtn = document.getElementById('play-pause-btn');
    playPauseIcon = document.getElementById('play-pause-icon');
    rewindBtn = document.getElementById('rewind-5s-btn');
    forwardBtn = document.getElementById('forward-5s-btn');
    progressBarContainer = document.getElementById('progress-bar-container');
    progressBarFill = document.getElementById('progress-bar-fill');
    currentTimeDisplay = document.getElementById('current-time-display');
    totalDurationDisplay = document.getElementById('total-duration-display');

    miniPlayerDiv = document.getElementById('mini-player');
    miniPlayerTitle = document.getElementById('mini-player-title');
    miniPlayerPlayPauseBtn = document.getElementById('mini-player-play-pause-btn');
    miniPlayerPlayPauseIcon = document.getElementById('mini-player-play-pause-icon');
    miniPlayerRewindBtn = document.getElementById('mini-player-rewind-btn');
    miniPlayerForwardBtn = document.getElementById('mini-player-forward-btn');
    miniPlayerCurrentTime = document.getElementById('mini-player-current-time');
    miniPlayerTotalDuration = document.getElementById('mini-player-total-duration');
    miniPlayerProgressBarContainer = document.getElementById('mini-player-progress-bar-container');
    miniPlayerProgressFill = document.getElementById('mini-player-progress-fill');
    miniPlayerCloseBtn = document.getElementById('mini-player-close-btn');

    headerPlayerPlayPauseButton = document.getElementById('header-player-play-pause-button');
    headerPlayerPlayPauseIcon = document.getElementById('header-player-play-pause-icon');
    headerPlayerProgressFill = document.getElementById('header-player-progress-fill');
    headerPlayerProgressContainer = document.getElementById('header-player-progress-container');

    if (!globalAudioPlayer) console.warn("Global audio player element not found.");
    if (!playPauseBtn && document.getElementById('play-pause-btn')) console.warn("Main play/pause button not found by populateFeaturedEpisode, but exists."); // Check if it's a timing issue with router
    if (!miniPlayerDiv) console.warn("Mini-player container not found.");
    if (!headerPlayerPlayPauseButton) console.warn("Header player play/pause button not found.");

    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (rewindBtn) rewindBtn.addEventListener('click', () => skipTime(-5));
    if (forwardBtn) forwardBtn.addEventListener('click', () => skipTime(5));
    if (progressBarContainer) progressBarContainer.addEventListener('click', handleProgressBarSeek);

    if (miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.addEventListener('click', togglePlayPause);
    if (miniPlayerRewindBtn) miniPlayerRewindBtn.addEventListener('click', () => skipTime(-5));
    if (miniPlayerForwardBtn) miniPlayerForwardBtn.addEventListener('click', () => skipTime(5));
    if (miniPlayerProgressBarContainer) miniPlayerProgressBarContainer.addEventListener('click', handleProgressBarSeek);
    if (miniPlayerCloseBtn) {
        miniPlayerCloseBtn.addEventListener('click', () => {
            if (miniPlayerDiv) {
                miniPlayerDiv.classList.add('hidden', 'opacity-0');
                miniPlayerDiv.classList.remove('visible');
                console.log('Mini-player closed by user.');
            }
        });
    }

    if (headerPlayerPlayPauseButton) {
        headerPlayerPlayPauseButton.addEventListener('click', togglePlayPause);
    }
    if (headerPlayerProgressContainer) {
        headerPlayerProgressContainer.addEventListener('click', handleProgressBarSeek);
    }

    if (globalAudioPlayer) {
        globalAudioPlayer.addEventListener('play', handleAudioPlay);
        globalAudioPlayer.addEventListener('pause', updatePlayPauseIcon);
        globalAudioPlayer.addEventListener('ended', handleAudioEnded);
        globalAudioPlayer.addEventListener('error', handleAudioError);
        globalAudioPlayer.addEventListener('loadedmetadata', updateDurationDisplay);
        globalAudioPlayer.addEventListener('timeupdate', updateTimeAndProgress);
    }
}

function togglePlayPause() {
    if (!globalAudioPlayer || !globalAudioPlayer.src) {
        console.warn("No audio source loaded.");
        return;
    }
    if (globalAudioPlayer.paused || globalAudioPlayer.ended) {
        globalAudioPlayer.play().catch(err => {
            console.error("Error playing audio:", err);
            displayErrorMessage(`Error playing audio: ${err.message}`);
            updatePlayPauseIcon();
        });
    } else {
        globalAudioPlayer.pause();
    }
}

function skipTime(seconds) {
    if (!globalAudioPlayer || !globalAudioPlayer.duration || isNaN(globalAudioPlayer.duration)) {
        console.warn("Cannot skip: Audio not loaded or duration unknown.");
        return;
    }
    const newTime = globalAudioPlayer.currentTime + seconds;
    globalAudioPlayer.currentTime = Math.max(0, Math.min(newTime, globalAudioPlayer.duration));
}

function updatePlayPauseIcon() {
    const isPaused = globalAudioPlayer && (globalAudioPlayer.paused || globalAudioPlayer.ended);
    const iconText = isPaused ? 'play_arrow' : 'pause';
    if (playPauseIcon) playPauseIcon.textContent = iconText;
    if (miniPlayerPlayPauseIcon) miniPlayerPlayPauseIcon.textContent = iconText;
    if (headerPlayerPlayPauseIcon) headerPlayerPlayPauseIcon.textContent = iconText;
}

function handleAudioPlay() {
    updatePlayPauseIcon();
    if (miniPlayerDiv) {
        miniPlayerDiv.classList.remove('hidden', 'opacity-0');
        miniPlayerDiv.classList.add('visible');
        console.log('Audio playing, mini-player shown.');
    }
}

function updateDurationDisplay() {
    const durationText = (globalAudioPlayer && !isNaN(globalAudioPlayer.duration)) ? formatDuration(globalAudioPlayer.duration) : '00:00';
    if (totalDurationDisplay) totalDurationDisplay.textContent = durationText;
    if (miniPlayerTotalDuration) miniPlayerTotalDuration.textContent = durationText;
}

function updateTimeAndProgress() {
    const currentTimeText = (globalAudioPlayer && !isNaN(globalAudioPlayer.currentTime)) ? formatDuration(globalAudioPlayer.currentTime) : '00:00';
    let progressPercent = 0;

    if (globalAudioPlayer && globalAudioPlayer.duration && !isNaN(globalAudioPlayer.duration) && globalAudioPlayer.duration > 0) {
        progressPercent = (globalAudioPlayer.currentTime / globalAudioPlayer.duration) * 100;
    }

    if (currentTimeDisplay) currentTimeDisplay.textContent = currentTimeText;
    if (progressBarFill) progressBarFill.style.width = `${progressPercent}%`;

    if (miniPlayerCurrentTime) miniPlayerCurrentTime.textContent = currentTimeText;
    if (miniPlayerProgressFill) miniPlayerProgressFill.style.width = `${progressPercent}%`;

    if (headerPlayerProgressFill) headerPlayerProgressFill.style.width = `${progressPercent}%`;
}

function handleAudioEnded() {
    console.log("Audio playback ended.");
    updatePlayPauseIcon();
    if (progressBarFill) progressBarFill.style.width = '0%';
    if (miniPlayerProgressFill) miniPlayerProgressFill.style.width = '0%';
    if (headerPlayerProgressFill) headerPlayerProgressFill.style.width = '0%';

    if (currentTimeDisplay) currentTimeDisplay.textContent = formatDuration(0);
    if (miniPlayerCurrentTime) miniPlayerCurrentTime.textContent = formatDuration(0);
}

function handleAudioError(event) {
    console.error("Audio player error:", event);
    let errorMessage = "An error occurred with the audio player.";
    if (globalAudioPlayer.error) {
        switch (globalAudioPlayer.error.code) {
            case MediaError.MEDIA_ERR_ABORTED: errorMessage = "Audio playback was aborted."; break;
            case MediaError.MEDIA_ERR_NETWORK: errorMessage = "A network error caused audio playback to fail."; break;
            case MediaError.MEDIA_ERR_DECODE: errorMessage = "The audio could not be decoded."; break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = "The audio format is not supported."; break;
            default: errorMessage = "An unknown error occurred.";
        }
    }
    displayErrorMessage(errorMessage);
    updatePlayPauseIcon();
    if (progressBarFill) progressBarFill.style.width = '0%';
    if (miniPlayerProgressFill) miniPlayerProgressFill.style.width = '0%';
    if (headerPlayerProgressFill) headerPlayerProgressFill.style.width = '0%';

    if (currentTimeDisplay) currentTimeDisplay.textContent = '00:00';
    if (miniPlayerCurrentTime) miniPlayerCurrentTime.textContent = '00:00';

    if (totalDurationDisplay) totalDurationDisplay.textContent = '00:00';
    if (miniPlayerTotalDuration) miniPlayerTotalDuration.textContent = '00:00';
}

function handleProgressBarSeek(event) {
    if (!globalAudioPlayer || !globalAudioPlayer.duration || isNaN(globalAudioPlayer.duration)) {
         console.warn("Cannot seek: Audio duration unknown.");
         return;
    }
    const clickedProgressBarContainer = event.currentTarget;
    const progressBarRect = clickedProgressBarContainer.getBoundingClientRect();
    const clickPositionX = event.clientX - progressBarRect.left;
    const boundedClickPositionX = Math.max(0, Math.min(clickPositionX, progressBarRect.width));
    const seekRatio = boundedClickPositionX / progressBarRect.width;
    const seekTime = globalAudioPlayer.duration * seekRatio;
    globalAudioPlayer.currentTime = seekTime;
}

function showLoadingMessage() {
    let loadingDiv = document.getElementById('rss-loading-message');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div'); loadingDiv.id = 'rss-loading-message';
        loadingDiv.textContent = 'Loading episodes...';
        loadingDiv.style.textAlign = 'center'; loadingDiv.style.padding = '20px'; loadingDiv.style.fontSize = '1.2em';
        const header = document.querySelector('header');
        if (header && header.nextSibling) header.parentNode.insertBefore(loadingDiv, header.nextSibling);
        else document.body.prepend(loadingDiv);
    }
    loadingDiv.style.display = 'block';
    const errorDiv = document.getElementById('rss-error-message');
    if (errorDiv) errorDiv.style.display = 'none';
}
function hideLoadingMessage() {
    const loadingDiv = document.getElementById('rss-loading-message');
    if (loadingDiv) loadingDiv.style.display = 'none';
}
function displayErrorMessage(message) {
    hideLoadingMessage();
    let errorDiv = document.getElementById('rss-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div'); errorDiv.id = 'rss-error-message';
        errorDiv.style.color = 'red'; errorDiv.style.backgroundColor = '#ffebee'; errorDiv.style.border = '1px solid red';
        errorDiv.style.padding = '10px'; errorDiv.style.textAlign = 'center'; errorDiv.style.margin = '10px auto';
        errorDiv.style.borderRadius = '5px'; errorDiv.style.maxWidth = '800px';
        const header = document.querySelector('header');
        if (header && header.nextSibling) header.parentNode.insertBefore(errorDiv, header.nextSibling);
        else document.body.prepend(errorDiv);
    }
    errorDiv.textContent = message; errorDiv.style.display = 'block';
}
async function fetchRSSFeed() {
    console.log('Fetching RSS feed...'); showLoadingMessage();
    try {
        const response = await fetch(RSS_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const xmlText = await response.text(); parseRSSFeed(xmlText);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        displayErrorMessage('Failed to load podcast feed. Please try again later.');
    }
}
function parseRSSFeed(xmlText) {
    const parser = new DOMParser(); const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    const parsingError = xmlDoc.getElementsByTagName('parsererror');
    if (parsingError.length > 0) {
        console.error('Error parsing XML:', parsingError[0].textContent);
        displayErrorMessage('Error processing podcast data. Feed might be malformed.'); return;
    }
    const items = xmlDoc.querySelectorAll('item');
    if (!items || items.length === 0) { displayErrorMessage('No episodes found in the feed.'); return; }
    const episodes = Array.from(items).map(item => {
        const title = item.querySelector('title')?.textContent || 'No title';
        const link = item.querySelector('link')?.textContent || '#';
        const description = item.querySelector('description')?.textContent || 'No description';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const enclosure = item.querySelector('enclosure');
        const audioUrl = enclosure?.getAttribute('url') || '#';
        let duration = '0';
        const itunesDurationNode = Array.from(item.childNodes).find(node => node.nodeName === 'itunes:duration' || node.localName === 'duration');
        if (itunesDurationNode) duration = itunesDurationNode.textContent;
        return { title, link, description, pubDate, audioUrl, duration };
    });
    populateHTML(episodes);
}

// --- MODIFIED populateHTML FOR EPISODE COUNT ---
function populateHTML(episodes) {
    if (!episodes || episodes.length === 0) {
        hideLoadingMessage();
        const appContent = document.getElementById('app-content');
        if (appContent && appContent.innerHTML.trim() === '') { // Check if app-content is empty before adding no episodes message
            appContent.innerHTML = '<p class="text-center p-4 text-gray-500">No episodes available at the moment.</p>';
        }
        return;
    }

    // Ensure player DOM references are fresh, especially if home content is reloaded by router
    // This is now more reliably handled in initializeHomePage called by router.
    // initializePlayerDOMReferences();

    if (episodes.length > 0) {
        populateFeaturedEpisode(episodes[0]); // 1st episode
    } else {
        populateFeaturedEpisode(null); // Handle empty case
    }

    // Order of sections in home_content.html: Featured, Destaques, Mais Ouvidos, Mais Episodios
    const episodesForDestaques = episodes.slice(1, 4);    // Episodes 2, 3, 4 (3 items)
    populateDestaques(episodesForDestaques);

    const episodesForMaisOuvidos = episodes.slice(4, 6);  // Episodes 5, 6 (2 items)
    populateMaisOuvidos(episodesForMaisOuvidos);

    const episodesForMaisEpisodios = episodes.slice(6, 10); // Episodes 7, 8, 9, 10 (4 items) - as requested
    populateMaisEpisodios(episodesForMaisEpisodios);

    hideLoadingMessage();
}
// --- END MODIFIED populateHTML ---

function populateFeaturedEpisode(episode) {
    if (!episode) { // Handle null episode (e.g. if RSS feed is empty)
        const featuredSection = document.querySelector('section.mb-10.bg-gray-100');
        if (featuredSection) {
            const titleEl = featuredSection.querySelector('h2.text-2xl');
            if (titleEl) titleEl.textContent = "No episode available";
            // Clear other fields or set to default
            if (currentTimeDisplay) currentTimeDisplay.textContent = '00:00';
            if (totalDurationDisplay) totalDurationDisplay.textContent = '00:00';
            if (progressBarFill) progressBarFill.style.width = '0%';
            if (globalAudioPlayer) globalAudioPlayer.src = ''; // Clear src
            updatePlayPauseIcon();
            if (miniPlayerTitle) miniPlayerTitle.textContent = "No track playing";
            if (miniPlayerTitle) miniPlayerTitle.title = "No track playing";
        }
        return;
    }

    const featuredSection = document.querySelector('section.mb-10.bg-gray-100');
    if (featuredSection) {
        const titleEl = featuredSection.querySelector('h2.text-2xl');
        if (titleEl) titleEl.textContent = episode.title;

        if (globalAudioPlayer) {
            if (globalAudioPlayer.currentSrc !== episode.audioUrl || globalAudioPlayer.src !== episode.audioUrl ) {
                globalAudioPlayer.src = episode.audioUrl;
            }
            if(currentTimeDisplay) currentTimeDisplay.textContent = '00:00';
            if(totalDurationDisplay) totalDurationDisplay.textContent = formatDuration(episode.duration);
            if(progressBarFill) progressBarFill.style.width = '0%';
            updatePlayPauseIcon();
            if (miniPlayerTitle) miniPlayerTitle.textContent = episode.title;
            if (miniPlayerTitle) miniPlayerTitle.title = episode.title;
        }
    }
}
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match]));
}
function formatDuration(durationStr) {
    if (!durationStr || durationStr === '0') return '00:00';
    if (String(durationStr).includes(':')) {
        const parts = String(durationStr).split(':');
        if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
        return String(durationStr);
    }
    const totalSeconds = parseInt(durationStr, 10);
    if (isNaN(totalSeconds)) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
    return `${paddedMinutes}:${paddedSeconds}`;
}
function createPodcastCardHTML(episode) {
    return `
        <div class="podcast-card flex items-center space-x-4 shadow">
            <a href="${episode.audioUrl}" target="_blank" class="play-button focus:outline-none" aria-label="Play episode ${escapeHTML(episode.title)}">
                <span class="material-icons text-gray-700">play_arrow</span>
            </a>
            <div><h4 class="font-medium text-gray-700 truncate" title="${escapeHTML(episode.title)}"><a href="${episode.link}" target="_blank">${escapeHTML(episode.title)}</a></h4><p class="text-sm text-gray-500">${formatDuration(episode.duration)}</p></div>
        </div>
    `;
}
function createHighlightCardHTML(episode) {
    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <a href="${episode.audioUrl}" target="_blank" class="w-full h-48 thumbnail-placeholder flex items-center justify-center bg-gray-200 hover:bg-gray-300" aria-label="Play episode ${escapeHTML(episode.title)}"><span class="material-icons text-6xl text-gray-400">mic</span></a>
            <div class="p-4"><h4 class="font-semibold text-gray-800 mb-1 truncate" title="${escapeHTML(episode.title)}"><a href="${episode.link}" target="_blank">${escapeHTML(episode.title)}</a></h4><p class="text-sm text-gray-500 mb-2">${formatDuration(episode.duration)}</p></div>
        </div>
    `;
}
function populateSection(sectionTitle, episodes, cardCreationFunction) {
    const sectionHeader = Array.from(document.querySelectorAll('h3.text-2xl.font-semibold.text-gray-800.mb-4')).find(h3 => h3.textContent.trim() === sectionTitle);
    if (!sectionHeader) { console.warn(`Section with title "${sectionTitle}" not found.`); return; }
    const cardContainer = sectionHeader.nextElementSibling;
    if (!cardContainer || !cardContainer.classList.contains('grid')) { console.warn(`Card container for section "${sectionTitle}" not found or is not a grid.`); return; }
    cardContainer.innerHTML = '';
    if (!episodes || episodes.length === 0) { cardContainer.innerHTML = '<p class="text-gray-500 col-span-full">No episodes to display in this section.</p>'; return; } // Added more specific message
    episodes.forEach(episode => { const cardHTML = cardCreationFunction(episode); cardContainer.insertAdjacentHTML('beforeend', cardHTML); });
}
function populateMaisOuvidos(episodes) { populateSection("Mais Ouvidos", episodes, createPodcastCardHTML); }
function populateMaisEpisodios(episodes) { populateSection("Mais Episódios", episodes, createPodcastCardHTML); }
function populateDestaques(episodes) { populateSection("Destaques", episodes, createHighlightCardHTML); }

FINAL_JS_EOF

echo "js/main.js entirely rewritten to adjust episode slicing in populateHTML for 'Mais Episodios' count."
