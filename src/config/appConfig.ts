export interface AppConfig {
  productName: string;
  productTagline: string;
  signatureQuote: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarLabel: string;
}

export const appConfig: AppConfig = {
  productName: 'Workflow',
  productTagline: 'Des contacts aux belles missions',
  signatureQuote: 'Des personnes, pas juste des projets.',
};

export const currentUser: CurrentUser = {
  id: 'user-manon',
  firstName: 'Manon',
  lastName: 'Rousseau',
  role: 'Freelance Web',
  avatarLabel: 'M',
};
