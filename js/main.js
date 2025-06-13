const RSS_URL = 'https://anchor.fm/s/105d2ac84/podcast/rss';

document.addEventListener('DOMContentLoaded', () => {
    fetchRSSFeed();
});

function showLoadingMessage() {
    let loadingDiv = document.getElementById('rss-loading-message');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'rss-loading-message';
        loadingDiv.textContent = 'Loading episodes...';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.padding = '20px';
        loadingDiv.style.fontSize = '1.2em';
        const header = document.querySelector('header'); // Insert after header
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(loadingDiv, header.nextSibling);
        } else {
            document.body.prepend(loadingDiv); // Fallback
        }
    }
    loadingDiv.style.display = 'block';
    const errorDiv = document.getElementById('rss-error-message');
    if (errorDiv) errorDiv.style.display = 'none'; // Hide error if showing loading
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('rss-loading-message');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

function displayErrorMessage(message) {
    hideLoadingMessage(); // Hide loading message if an error occurs
    let errorDiv = document.getElementById('rss-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'rss-error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.backgroundColor = '#ffebee';
        errorDiv.style.border = '1px solid red';
        errorDiv.style.padding = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.margin = '10px auto'; // Centered margin
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.maxWidth = '800px'; // Max width for better layout

        const header = document.querySelector('header'); // Insert after header
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(errorDiv, header.nextSibling);
        } else {
            document.body.prepend(errorDiv); // Fallback
        }
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

async function fetchRSSFeed() {
    console.log('Fetching RSS feed...');
    showLoadingMessage();
    try {
        const response = await fetch(RSS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlText = await response.text();
        console.log('RSS feed fetched successfully.');
        parseRSSFeed(xmlText);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        displayErrorMessage('Failed to load podcast feed. Please try again later.');
    }
}

function parseRSSFeed(xmlText) {
    console.log('Parsing RSS feed...');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const parsingError = xmlDoc.getElementsByTagName('parsererror');
    if (parsingError.length > 0) {
        console.error('Error parsing XML:', parsingError[0].textContent);
        displayErrorMessage('Error processing podcast data. The feed might be malformed.');
        return;
    }

    const items = xmlDoc.querySelectorAll('item');
    if (!items || items.length === 0) {
        console.warn('No podcast items found in the RSS feed.');
        displayErrorMessage('No episodes found in the feed.');
        return;
    }

    console.log(`Found ${items.length} items.`);
    const episodes = Array.from(items).map(item => {
        const title = item.querySelector('title')?.textContent || 'No title';
        const link = item.querySelector('link')?.textContent || '#';
        const description = item.querySelector('description')?.textContent || 'No description';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const enclosure = item.querySelector('enclosure');
        const audioUrl = enclosure?.getAttribute('url') || '#';

        let duration = '0';
        // Handle potential namespace issues for itunes:duration
        const itunesDurationNode = Array.from(item.childNodes).find(node => node.nodeName === 'itunes:duration' || node.localName === 'duration');
        if (itunesDurationNode) {
            duration = itunesDurationNode.textContent;
        }

        return { title, link, description, pubDate, audioUrl, duration };
    });

    console.log('Episodes extracted. First episode title:', episodes.length > 0 ? episodes[0].title : 'N/A');
    populateHTML(episodes);
}

function populateHTML(episodes) {
    if (!episodes || episodes.length === 0) {
        console.warn('No episodes to populate HTML.');
        // Error message already handled by parseRSSFeed if items.length is 0
        hideLoadingMessage();
        return;
    }
    console.log('Populating HTML...');

    populateFeaturedEpisode(episodes[0]);
    // Slice carefully: if less episodes than expected, it won't error.
    populateMaisOuvidos(episodes.slice(1, 3));
    populateMaisEpisodios(episodes.slice(3, 7));
    populateDestaques(episodes.slice(7, 10));

    hideLoadingMessage();
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return str.replace(/[&<>"']/g, function (match) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match];
    });
}

function formatDuration(durationStr) {
    if (!durationStr || durationStr === '0') return 'N/A';
    if (durationStr.includes(':')) { // Already in HH:MM:SS or MM:SS format
        const parts = durationStr.split(':');
        if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
        return durationStr; // Fallback for unknown colon format
    }
    const totalSeconds = parseInt(durationStr, 10);
    if (isNaN(totalSeconds)) return 'N/A';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
}

function populateFeaturedEpisode(episode) {
    if (!episode) return;
    console.log('Populating Featured Episode:', episode.title);

    const featuredSection = document.querySelector('section.mb-10.bg-gray-100'); // This is the main featured episode section
    if (featuredSection) {
        const titleEl = featuredSection.querySelector('h2.text-2xl');
        const durationEl = featuredSection.querySelector('p.text-gray-500'); // This selector is for the duration

        if (titleEl) titleEl.textContent = episode.title;
        if (durationEl) durationEl.textContent = formatDuration(episode.duration);

        // Consider adding a link to the episode page or a play button
        const playIconContainer = featuredSection.querySelector('.thumbnail-placeholder');
        if(playIconContainer && playIconContainer.parentElement) { // Make the icon clickable
            const anchor = document.createElement('a');
            anchor.href = episode.audioUrl; // Link to audio or episode.link
            anchor.target = '_blank'; // Open in new tab
            anchor.innerHTML = playIconContainer.innerHTML; // Move the icon inside the anchor
            playIconContainer.innerHTML = '';
            playIconContainer.appendChild(anchor);
        }
    } else {
        console.warn('Featured episode section not found for population.');
    }
}

function createPodcastCardHTML(episode) {
    return `
        <div class="podcast-card flex items-center space-x-4 shadow">
            <a href="${episode.audioUrl}" target="_blank" class="play-button focus:outline-none" aria-label="Play episode ${escapeHTML(episode.title)}">
                <span class="material-icons text-gray-700">play_arrow</span>
            </a>
            <div>
                <h4 class="font-medium text-gray-700 truncate" title="${escapeHTML(episode.title)}">
                    <a href="${episode.link}" target="_blank">${escapeHTML(episode.title)}</a>
                </h4>
                <p class="text-sm text-gray-500">${formatDuration(episode.duration)}</p>
            </div>
        </div>
    `;
}

function createHighlightCardHTML(episode) {
    return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <a href="${episode.audioUrl}" target="_blank" class="w-full h-48 thumbnail-placeholder flex items-center justify-center bg-gray-200 hover:bg-gray-300" aria-label="Play episode ${escapeHTML(episode.title)}">
                <span class="material-icons text-6xl text-gray-400">mic</span>
            </a>
            <div class="p-4">
                <h4 class="font-semibold text-gray-800 mb-1 truncate" title="${escapeHTML(episode.title)}">
                    <a href="${episode.link}" target="_blank">${escapeHTML(episode.title)}</a>
                </h4>
                <p class="text-sm text-gray-500 mb-2">${formatDuration(episode.duration)}</p>
            </div>
        </div>
    `;
}

function populateSection(sectionTitle, episodes, cardCreationFunction) {
    const sectionHeader = Array.from(document.querySelectorAll('h3.text-2xl.font-semibold.text-gray-800.mb-4'))
        .find(h3 => h3.textContent.trim() === sectionTitle);

    if (!sectionHeader) {
        console.warn(`Section with title "${sectionTitle}" not found.`);
        return;
    }

    const cardContainer = sectionHeader.nextElementSibling; // Assuming grid div is the immediate next sibling
    if (!cardContainer || !cardContainer.classList.contains('grid')) {
        console.warn(`Card container for section "${sectionTitle}" not found or is not a grid.`);
        return;
    }

    cardContainer.innerHTML = ''; // Clear existing static cards
    if (!episodes || episodes.length === 0) {
        cardContainer.innerHTML = '<p class="text-gray-500 col-span-full">No episodes to display in this section currently.</p>';
        return;
    }

    episodes.forEach(episode => {
        const cardHTML = cardCreationFunction(episode);
        cardContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function populateMaisOuvidos(episodes) {
    populateSection("Mais Ouvidos", episodes, createPodcastCardHTML);
}

function populateMaisEpisodios(episodes) {
    populateSection("Mais Episódios", episodes, createPodcastCardHTML);
}

function populateDestaques(episodes) {
    populateSection("Destaques", episodes, createHighlightCardHTML);
}

EOF

echo "js/main.js has been completely rewritten with fetching, parsing, and HTML population logic."
