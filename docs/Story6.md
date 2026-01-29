  Recette Epic 7

  Page Premium (/premium)

  - La page affiche les 4 bénéfices, le prix 9,99€/mois, et le bouton "Découvrir Premium"
  - Le bouton redirige vers Stripe Checkout (en mode test)

  Checkout Stripe

  - Stripe Checkout s'ouvre avec le bon montant (9,99€)
  - Carte de test : 4242 4242 4242 4242, date future, CVC quelconque
  - Après paiement → retour sur /premium?success=true
  - Annuler le checkout → retour sur /premium?cancelled=true sans erreur

  Activation Premium

  - Après paiement réussi, se déconnecter/reconnecter
  - Sur /profile → le badge affiche "Premium" au lieu de "Gratuit"
  - Le bouton "Gérer" apparaît à côté du badge Premium

  Gating parcours

  - Sur /explore, cliquer sur un parcours premium (marqué avec l'étoile)
    - En free → modal "Ce parcours est réservé aux explorateurs Premium"
    - En Premium → navigation normale vers le détail

  Gestion abonnement

  - Sur /profile, cliquer "Gérer" → ouvre le Stripe Customer Portal
  - Possibilité d'annuler depuis le portal
  - Après annulation, le webhook remet is_premium = false

  Carte de test Stripe
  ┌─────────────────┬─────────────────────┐
  │    Scénario     │   Numéro de carte   │
  ├─────────────────┼─────────────────────┤
  │ Paiement réussi │ 4242 4242 4242 4242 │
  ├─────────────────┼─────────────────────┤
  │ Paiement refusé │ 4000 0000 0000 0002 │
  ├─────────────────┼─────────────────────┤
  │ Auth 3D Secure  │ 4000 0025 0000 3155 │
  └─────────────────┴─────────────────────┘
  Dis-moi quand c'est configuré et je t'aide à debug si besoin.