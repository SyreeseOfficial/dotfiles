// Add these constants at the top
const DOMAIN = "https://skool.com";

const colorOfBookmarkActive = "#F8D481";
const colorOfBookmarkNotActive = "#909090";

// Define states for easy toggling later
const BOOKMARK_STATES = {
  selected: {
    fill: colorOfBookmarkActive,
    stroke: colorOfBookmarkActive,
    d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",
  },
  unselected: {
    fill: "none",
    stroke: colorOfBookmarkNotActive,
    d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z",
  },
};

// Add this function at the top with other utilities
const extractSlug = (url) => {
  if (!url) return "";

  // Remove any query parameters and trailing slashes
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "");

  // Get all parts of the path
  const parts = cleanUrl.split("/").filter(Boolean);

  // Get the last part as the slug
  const slug = parts[parts.length - 1];
  const category = parts[parts.length - 2];


  return { slug, category } || "";
};

const extractPostHref = (postElement) => {
  try {
    // Find the TitleWrapper div
    const titleWrapper = postElement.querySelector(
      'div[class*="TitleWrapper"]'
    );
    if (!titleWrapper) {
      //   console.log("No TitleWrapper found");
      return { href: "", title: "", category: "" };
    }

    // Get the immediate parent anchor tag
    const postLink = titleWrapper.closest('a[class*="styled__ChildrenLink"]');
    if (!postLink) {
      //   console.log("No parent anchor tag found for TitleWrapper");
      return { href: "", title: "", category: "" };
    }

    // Extract href
    const href = postLink.getAttribute("href");

    // Extract category from href
    const category = href ? href.split("/").filter(Boolean)[0] || "" : "";

    // Extract title from the nested divs inside the anchor
    let title = "";
    const titleDiv = postLink.querySelector('div[class*="styled__Title"]');
    if (titleDiv) {
      title = titleDiv.textContent.trim();
    }

    // console.log("Found post data:", { href, title, category });
    return { href, title, category };
  } catch (error) {
    console.error("Error extracting post data:", error);
    return { href: "", title: "", category: "" };
  }
};

// Add this function near the top with other utilities
const createBookmarkContainer = ({
  postLink,
  slug,
  title,
  state,
  marginLeft = "8px",
}) => `
  <div class="">
    <div style="display: inline-flex; align-items: center;">
      <div 
        class="bookmark-icon-wrapper"
        style="
          display: inline-block;
          cursor: pointer;
          z-index: 50;
          position: relative;
          margin-left: ${marginLeft};
        "
      >
        <svg 
          data-bookmark-icon
          data-post-url="${postLink || ""}"
          data-slug="${slug}"
          data-title="${title.replace(/"/g, "&quot;")}"
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="${state.fill}"
          stroke="${state.stroke}"
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="
            width: 20px; 
            height: 20px; 
            cursor: pointer;
            vertical-align: middle;
            position: relative;
            top: -1px;
            pointer-events: all;
          "
        >
          <path 
            d="${state.d}" 
            fill="${state.fill}"
            style="pointer-events: none;"
          />
        </svg>
      </div>
    </div>
  </div>
`;

// Add this utility function at the top
const safeStorageGet = async (key) => {
  try {
    return await chrome.storage.local.get(key);
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.log('Extension context invalidated. Please refresh the page.');
      return { [key]: [] };
    }
    throw error;
  }
};

const locateAllDivsForBookmark = async () => {
  const { bookmarks = [] } = await safeStorageGet("bookmarks");
  //   console.log("locateAllDivsForBookmark bookmarks", bookmarks);

  // Feeds
  const postContainersFeeds = Array.from(
    document.getElementsByTagName("div")
  ).filter((div) => {
    const classList = div.className;
    return classList.includes("PostItemWrapper");
  });

  postContainersFeeds.forEach(async (postContainer) => {
    if (!postContainer.querySelector("svg[data-bookmark-icon]")) {
      const { href: postLink, title } = extractPostHref(postContainer);
      const { slug, category } = extractSlug(postLink);

      const commentsRow = postContainer.querySelector('[class*="CommentsRow"]');
      if (!commentsRow) return;

      // Check if bookmark exists by looking for matching slug in the array
      const isBookmarked = bookmarks.some((bookmark) => bookmark.slug === slug);
      const state = isBookmarked
        ? BOOKMARK_STATES.selected
        : BOOKMARK_STATES.unselected;

      const bookmarkContainer = createBookmarkContainer({
        postLink,
        slug,
        title,
        state,
      });

      if (commentsRow) {
        commentsRow.insertAdjacentHTML("afterend", bookmarkContainer);
      }
    }
  });

  // Popups
  const postContainersPopups = Array.from(
    document.getElementsByTagName("div")
  ).filter((div) => {
    const classList = div.className;
    return classList.includes("BoxWrapper");
  });

  postContainersPopups.forEach(async (postContainer) => {
    if (!postContainer.querySelector("svg[data-bookmark-icon]")) {
      // Find the title span within the popup
      const titleSpan = postContainer.querySelector('span[class*="Title"]');
      if (!titleSpan) return;

      const title = titleSpan.textContent.trim();

      const { slug, category } = extractSlug(window.location.href);
      const postLink = `${DOMAIN}/${category}/${slug}`;
    //   console.log({
    //     isPopup: true,
    //     slug,
    //     category,
    //     postLink,
    //   });

      const isBookmarked = bookmarks.some((bookmark) => bookmark.slug === slug);
      const state = isBookmarked
        ? BOOKMARK_STATES.selected
        : BOOKMARK_STATES.unselected;

      const bookmarkContainer = createBookmarkContainer({
        postLink,
        slug,
        title,
        state,
        marginLeft: "12px",
      });

      // Find the reactions wrapper
      const reactionsWrapper = postContainer.querySelector(
        'div[class*="PostDetailReactionsWrapper"]'
      );
      if (reactionsWrapper) {
        // Append to the end of the reactions wrapper
        reactionsWrapper.insertAdjacentHTML("beforeend", bookmarkContainer);
      }
    }
  });

  return postContainersFeeds;
};

// Update the init function to handle async
const init = async () => {
  try {
    const divsFound = await locateAllDivsForBookmark();
    observeDOM();
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.log('Extension context invalidated. Please refresh the page.');
      // Optionally reload the page
      // window.location.reload();
    } else {
      console.error('Error initializing:', error);
    }
  }
};

// Update the observer to handle async
const observeDOM = () => {
  const observer = new MutationObserver((mutations) => {
    locateAllDivsForBookmark().then((divsFound) => {});
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

// Update initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.addEventListener("load", init);

// Add this function to handle bookmark toggling
const toggleBookmark = async (svg) => {
  const slug = svg.dataset.slug;
  const postUrl = svg.dataset.postUrl;
  const title = svg.dataset.title || "Untitled";

  try {
    const result = await safeStorageGet("bookmarks");
    let bookmarks = result.bookmarks || [];

    if (!postUrl) {
      console.error("No URL found for bookmark");
      return;
    }

    const existingBookmarkIndex = bookmarks.findIndex(
      (b) => b.url === postUrl || b.slug === slug
    );
    const isNowBookmarked = existingBookmarkIndex === -1;

    if (existingBookmarkIndex !== -1) {
      // Remove bookmark
      bookmarks.splice(existingBookmarkIndex, 1);
    } else {
      // Add new bookmark
      const { slug: urlSlug, category } = extractSlug(postUrl);
      bookmarks.push({
        id: crypto.randomUUID(),
        title: title,
        url: postUrl,
        group: category,
        slug: urlSlug,
      });
    }

    try {
      await chrome.storage.local.set({ bookmarks });
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.log('Extension context invalidated. Please refresh the page.');
        return;
      }
      throw error;
    }

    // Update ALL bookmark icons with the same slug
    const allRelatedIcons = document.querySelectorAll(
      `svg[data-bookmark-icon][data-slug="${slug}"]`
    );
    allRelatedIcons.forEach((icon) => {
      const state = isNowBookmarked
        ? BOOKMARK_STATES.selected
        : BOOKMARK_STATES.unselected;

      // Update the SVG attributes
      icon.setAttribute("fill", state.fill);
      icon.setAttribute("stroke", state.stroke);
      icon.querySelector("path").setAttribute("d", state.d);
      icon.querySelector("path").setAttribute("fill", state.fill);
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    if (error.message.includes('Extension context invalidated')) {
      // Optional: Show a user-friendly notification that they need to refresh
      const notification = document.createElement('div');
      notification.textContent = 'Please refresh the page to continue using bookmarks';
      notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 10px; border-radius: 4px; z-index: 9999;';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    }
  }
};

// Update the click event listener to handle both SVG and path clicks
document.addEventListener(
  "click",
  async (e) => {
    const bookmarkWrapper = e.target.closest(".bookmark-icon-wrapper");
    if (!bookmarkWrapper) return;

    const svg = bookmarkWrapper.querySelector("svg[data-bookmark-icon]");
    if (!svg) return;

    // Stop event in its tracks
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // console.log("Bookmark icon clicked:", svg);
    await toggleBookmark(svg);

    return false;
  },
  {
    capture: true, // Handle event in capture phase
    passive: false, // Allow preventDefault
  }
);

// Add a second event listener to prevent click-through
document.addEventListener(
  "click",
  (e) => {
    if (e.target.closest(".bookmark-icon-wrapper")) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  },
  {
    capture: true,
    passive: false,
  }
);

// Add this near the top with other listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "UPDATE_BOOKMARK_UI") {
    const { url, isBookmarked } = message.data;
    const { slug, category } = extractSlug(url);

    // Find all bookmark icons for this URL/slug
    const bookmarkIcons = document.querySelectorAll(
      `svg[data-bookmark-icon][data-post-url="${url}"]`
    );

    bookmarkIcons.forEach((svg) => {
      const state = isBookmarked
        ? BOOKMARK_STATES.selected
        : BOOKMARK_STATES.unselected;

      // Update the SVG attributes
      svg.setAttribute("fill", state.fill);
      svg.setAttribute("stroke", state.stroke);
      svg.querySelector("path").setAttribute("d", state.d);
      svg.querySelector("path").setAttribute("fill", state.fill);
    });
  }
});
