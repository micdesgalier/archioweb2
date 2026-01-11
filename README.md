***

# Projet ArchioWeb

## 1. Présentation du projet
Cette application est une API backend développée en **Node.js / Express**, utilisant **MongoDB** comme base de données et intégrant un système de chat en temps réel via **WebSocket**.  
Le projet fonctionne avec un **seul `package.json` à la racine** et se lance entièrement depuis ce dossier.

***

## 2. Prérequis
Avant l’installation, assurez-vous d’avoir les outils suivants installés sur votre machine :

- **Node.js** (version 18 ou supérieure)  
- **npm** (fourni avec Node.js)  
- **MongoDB** (local ou MongoDB Atlas)  
- **Git** (optionnel)

### Vérification :
```bash
node -v
npm -v
mongod --version
```

***

## 3. Récupération du projet
Cloner le dépôt Git :
```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_PROJET>
```

Ou simplement ouvrir le dossier du projet si vous l’avez déjà.

***

## 4. Installation des dépendances
⚠️ Une seule commande à la racine du projet :
```bash
npm install
```

Cela installe :
- Express  
- Mongoose  
- JWT  
- WebSocket  
- Jest / Supertest (tests)  
- Autres dépendances nécessaires

***

### 5. Description des variables

| Variable       | Description                         |
|----------------|-------------------------------------|
| PORT           | Port du serveur Express             |
| MONGO_URI      | URI de connexion MongoDB            |
| JWT_SECRET     | Clé secrète pour les tokens JWT     |
| JWT_EXPIRES_IN | Durée de validité du token          |
| NODE_ENV       | Environnement (development / production) |

***

## 6. Lancer MongoDB

### MongoDB local
Dans un terminal séparé :
```bash
mongod
```

### MongoDB Atlas
- Vérifier que `MONGO_URI` pointe vers le cluster.  
- Autoriser votre IP dans Atlas.

***

## 7. Lancer l’application

### Mode développement
Depuis la racine du projet :
```bash
npm run ws-chat
npm run dev
```

Le serveur démarre sur :  
➡️ [http://localhost:8989](http://localhost:8989)

***

## 8. Routes principales disponibles

### API REST

| Méthode | Route                | Description            |
|----------|----------------------|------------------------|
| POST     | /api/login           | Connexion utilisateur  |
| POST     | /api/register        | Création de compte     |
| GET      | /api/users           | Liste des utilisateurs |
| PUT      | /api/users/:id       | Mise à jour utilisateur |
| GET      | /api/study-groups    | Liste des groupes      |
| POST     | /api/study-groups    | Création d’un groupe   |
| GET      | /api/cities          | Liste des villes       |

### Exemple : récupérer les villes
```bash
GET http://localhost:8989/api/cities
```

**Réponse :**
```json
[
  {
    "name": "Lausanne",
    "country": "Suisse",
    "postal_code": "1000"
  }
]
```

***

## 9. WebSocket (Chat)
- Le serveur WebSocket est lancé automatiquement avec l’application.  
- **Canal principal** : `chat`  
- **Canal utilisateurs connectés** : `users`  
- Les messages privés sont gérés via la base MongoDB.

***

## 10. Lancer les tests automatisés
Les tests utilisent **Jest + MongoDB en mémoire**.

Depuis la racine :
```bash
npm test
```

Cela :
- Démarre une base MongoDB temporaire  
- Teste les routes API  
- Nettoie la base entre chaque test  

***