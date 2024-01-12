const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  console.error("La variable d'environnement PRIVATE_KEY est vide ou non définie.");
  process.exit(1); // Quitte le programme avec un code d'erreur
}

// Si la variable d'environnement PRIVATE_KEY n'est pas vide, vous pouvez l'utiliser ici.
console.log("La clé privée est définie : " + privateKey);
