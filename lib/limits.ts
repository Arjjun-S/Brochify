export function truncateWords(text: string, maxWords: number) {
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }
  return text;
}

export const LIMITS = {
  aboutCollege: 150,
  aboutSchool: 100,
  aboutDepartment: 120,
  aboutFDP: 100,
  eventTitle: 20,
  committee: 50, // per group
};