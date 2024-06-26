# PRD  Optimisation des déplacements d’échantillons médicaux dans le cadre de la Sclérose Latérale Amyotrophique (SLA ou Maladie de Charcot)

Ce projet correspond à la deuxième partie de mon PRD, à savoir un outil de visualisation des solutions proposées par le modèle,
avec pour objectif de pouvoir modifier à sa guise les flux d'échantillons et évaluer l'impact de ces décisions sur la solution optimale.

## Technologies utilisées

Le projet est codé en TypeScript avec le framework Angular, ainsi que la bibliothèque Leaflet pour la gestion de la carte interactive.

## Initialisation du projet

Après avoir pull le projet depuis le repository Git (`https://github.com/ZeyzerDeIx/PRD`),  
ouvrez un terminal et déplacez vous dans le dossier "PRD".
D'ici, lancez la commande `npm install` pour installer toutes les dépendances du projet.  
  
  
La commande `ng serve` ouvrira un serveur de développement à l'adresse `http://localhost:4200`.  
Vous pouvez également lancer `ng serve --open` pour ouvrir l'onglet automatiquement.

## Tester l'application sans être developpeur

Le fichier PRD.7z contient une version packagée du projet, dedans vous pouvez lancer prd-0.0.0 pour tester l'application directement.

## Construire les exécutables

Placez vous à la racine du projet et utilisez la commande `npm run package:win` pour windows, `npm run package:os` pour OS X, `npm run package:linux` pour Linux ou encore `npm run package:all` pour tout faire.

## Documentation  

L'entièreté du code est documentée, et le projet utilise l'outil CompoDoc pour générer la documentation  
sous la forme d'un site web.  
La commande `npm run compodoc` permet de regénérer la documentation et ouvre un serveur à l'adresse `http://127.0.0.1:8080/`.
Vous pouvez lancer `npm run compodoc generate` et `npm run compodoc serve` pour respectivement regénérer la documention et ouvrir le serveur.