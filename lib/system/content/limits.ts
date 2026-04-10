export function truncateWords(text: string, maxWords: number) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }
  return text;
}

export const LIMITS = {
  aboutCollege: 110,
  aboutSchool: 75,
  aboutDepartment: 100,
  aboutFDP: 85,
  eventTitle: 20,
  committee: 50, // per group
};