/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F2EEE8',
    tint: '#C78252',
    background: '#11100F',
    foreground: '#F2EEE8',
    card: '#1B1917',
    cardForeground: '#F2EEE8',
    primary: '#C78252',
    primaryForeground: '#171311',
    secondary: '#25211E',
    secondaryForeground: '#F2EEE8',
    muted: '#211E1C',
    mutedForeground: '#A9A098',
    accent: '#3A2B22',
    accentForeground: '#E8B487',
    destructive: '#D86C65',
    destructiveForeground: '#FFF8F2',
    border: '#332E2A',
    input: '#24211F',
  },
  radius: 16,
};

export default colors;
