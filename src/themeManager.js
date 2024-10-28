export async function loadTheme(themePath) {
  // try {
  //   const response = await fetch(themePath);
  //   const theme = await response.json();
  //   applyLightTheme(theme);
  //   applyInitialDarkModeState(theme);
  // } catch (error) {
  //   console.error('Error loading theme:', error);
  // }
  try {
    console.log("Attempting to load theme from path:", themePath); // Add this line
    const response = await fetch(themePath);
    if (!response.ok) {
      throw new Error(`Failed to load theme. Status: ${response.status}`);
    }
    const theme = await response.json();
    console.log("Theme loaded:", theme); // Check if theme JSON data is loaded
    applyLightTheme(theme);
    // applyInitialDarkModeState(theme);
  } catch (error) {
    console.error("Error loading theme:", error);
  }
}

function applyLightTheme(theme) {
  const properties = generateCSSVariables(theme);
  applyThemeProperties(properties);
}

// function applyDarkTheme(lightTheme) {
//   const darkTheme = generateDarkTheme(lightTheme);
//   const darkProperties = generateCSSVariables(darkTheme);
//   applyThemeProperties(darkProperties);
// }

function generateCSSVariables(theme) {
  return {
    '--primary-color': theme.primary,
    '--secondary-color': theme.secondary,
    '--background-color': theme.background,
    '--container-background-color': theme.container,
    '--text-color': theme.text,
    '--inverse-text-color': theme.inverseText,
    '--border-color': theme.border,
    '--hover-color': theme.hover,
    '--disabled-color': theme.disabled,
    '--cursor-border-color': theme.cursorBorder,
    '--cursor-background-color': theme.cursorBackground,
    '--game-background-color': theme.gameBackground,
    '--word-active-color': theme.wordActive,
    '--word-grounded-color': theme.wordGrounded,
    '--input-outline-color': theme.inputOutline,
    '--placeholder-color': theme.placeholder,
    '--screencast-background-color': theme.screencastBackground,
    '--screencast-active-color': theme.screencastActive,
    '--dialog-background-color': theme.dialogBackground,
    '--slider-background-color': theme.sliderBackground,
    '--checkbox-background-color': theme.checkBoxBackground,
  };
}

function applyThemeProperties(properties) {
  Object.entries(properties).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

// function generateDarkTheme(lightTheme) {
//   const adjustColor = (color, amount) => {
//     let hex = color.startsWith('#') ? color.slice(1) : color;
//     let num = parseInt(hex, 16);

//     let r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
//     let g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
//     let b = Math.max(0, Math.min(255, (num & 0xff) + amount));

//     return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
//   };

//   return { // TODO:Ccurrently not enabled because it is ugly! It now looks like a ZEN mode...
//     // primary: adjustColor(lightTheme.primary, -50), // Darker but vivid
//     // secondary: adjustColor(lightTheme.secondary, -50), // Subtle secondary
//     // background: '#2e2e2e', // Dark grey background for better aesthetics
//     // text: '#f0f0f0', // Light grey text for good contrast
//     // inverseText: '#1a1a1a', // Very dark inverse text
//     // border: adjustColor(lightTheme.border, -30), // Softer border
//     // hover: adjustColor(lightTheme.hover, -20), // Slightly darker hover
//     // disabled: '#555555', // Grey disabled state
//     // cursorBorder: lightTheme.cursorBorder, // Keep original cursor border
//     // cursorBackground: lightTheme.cursorBackground, // No change
//     // gameBackground: '#3a3a3a', // Slightly darker grey for game area
//     // wordActive: adjustColor(lightTheme.wordActive, -30), // More muted active word
//     // wordGrounded: adjustColor(lightTheme.wordGrounded, -20), // Darkened grounded word
//     // inputOutline: adjustColor(lightTheme.inputOutline, -40), // Darker input outline
//     // placeholder: '#aaaaaa', // Muted placeholder
//     // screencastBackground: '#2c2c2c', // Darker screencast background
//     // screencastActive: adjustColor(lightTheme.screencastActive, -30), // Softer active state
//     // dialogBackground: '#333333', // Darker dialog background
//     // sliderBackground: '#444444', // Grey slider background
//   };
// }

function getThemePath() {
  const now = new Date();
  const halloweenDate = new Date(now.getFullYear(), 9, 31); // October 31st
  const startHalloweenPeriod = new Date(halloweenDate);
  startHalloweenPeriod.setDate(halloweenDate.getDate() - 5); // 3 days before
  const endHalloweenPeriod = new Date(halloweenDate);
  endHalloweenPeriod.setDate(halloweenDate.getDate() + 3); // 3 days after

  if (now >= startHalloweenPeriod && now <= endHalloweenPeriod) {
    return '/resources/themes/halloween.json';
  }
  return '/resources/themes/kumo.json';
}

// Load theme based on the date check
loadTheme(getThemePath());