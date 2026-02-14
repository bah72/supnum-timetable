import { createSecureUser } from './app/lib/auth-secure.js';

// Créer les utilisateurs scheduler
async function createSchedulerUsers() {
  const users = [
    {
      username: 'mamadou.diallo@supnum.mr',
      password: 'Supnum2024!', // Mot de passe par défaut (à changer)
      role: 'scheduler',
      name: 'Mamadou Diallo'
    },
    {
      username: 'meya.haroune@supnum.mr',
      password: 'Supnum2024!', // Mot de passe par défaut (à changer)
      role: 'scheduler',
      name: 'Meya Haroune'
    }
  ];

  for (const user of users) {
    console.log(`🔧 Création de l'utilisateur: ${user.username}`);
    
    const result = await createSecureUser(
      user.username,
      user.password,
      user.role,
      user.name
    );
    
    if (result.success) {
      console.log(`✅ Utilisateur ${user.username} créé avec succès:`, result.user);
    } else {
      console.error(`❌ Erreur lors de la création de ${user.username}:`, result.error);
    }
    
    console.log('---');
  }
}

createSchedulerUsers();
