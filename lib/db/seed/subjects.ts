/**
 * Canonical subject definitions for Qorma MVP.
 * Import this into the seeder — do not hardcode in components.
 */

export const SUBJECTS = [
  {
    slug: 'mathematics',
    name: 'Mathematics',
    iconName: 'Calculator',
    description: 'Algebra, calculus, geometry, statistics and more.',
    sortOrder: 1,
  },
  {
    slug: 'physics',
    name: 'Physics',
    iconName: 'Atom',
    description: 'Mechanics, electricity, waves, thermodynamics and more.',
    sortOrder: 2,
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    iconName: 'FlaskConical',
    description: 'Organic, inorganic, physical chemistry and stoichiometry.',
    sortOrder: 3,
  },
  {
    slug: 'biology',
    name: 'Biology',
    iconName: 'Leaf',
    description: 'Cell biology, genetics, ecology, human physiology and more.',
    sortOrder: 4,
  },
  {
    slug: 'english',
    name: 'English',
    iconName: 'BookOpen',
    description: 'Reading comprehension, grammar, vocabulary and writing.',
    sortOrder: 5,
  },
] as const
