⏺ Checklist de Test - Epic 4: Expérience de Balade

  1. Démarrer une Balade (Story 4-2)

  - Sur /routes/[id], le bouton "C'est parti !" est visible
  Ok
  - Clic sur le bouton → loading state affiché ("Démarrage...")
  Ok
  - Redirection vers /walks/[id] après création
  Ok
  - Walk créée en DB avec status "active"
  Je ne sais pas, comment jaccède à la DB ?
  - Si erreur API → toast d'erreur (pas d'alert bloquant)
	Comment provoquer l'erreur ?
  - Utilisateur non connecté → comportement attendu (redirection login?)
	Oui ca serait bien
	Typiquement, sans etre connecter, je vois la page (http://localhost:3020/routes/8) ce qui n'est pas normal. Et quand je clique sur "c'est partie", rien ne se passe, dans le network j'ai une 401 Unauthorized. Cette erreur et ce cas n'est pas traité

  2. Interface WalkTracker (Story 4-3)

  - Page fullscreen sans header/footer navigation
	Ok
  - Carte affichée en plein écran
	Ok
  - Nom du parcours affiché en haut (badge blanc)
	Non
  - Bouton "Annuler" visible en haut à gauche
	Ok
  - Panel bas avec stats (Temps, Distance, Min restantes)
	Ok
  - Bouton "Terminer la balade" visible et fonctionnel
	Ok

  3. Position GPS Temps Réel (Story 4-4)

  - Demande de permission GPS au chargement
	Ok
  - Position mise à jour sur la carte (si GPS disponible)
	Ok
  - Message d'erreur si GPS refusé ("Permission GPS refusée")
	Ok
  - Message d'erreur si GPS timeout ("Délai GPS dépassé")
	Ok
  - Path tracé au fur et à mesure du déplacement
	A tester dans un second temps

  4. Temps et Distance (Story 4-5)

  - Chronomètre démarre automatiquement (format mm:ss)
	Ok
  - Distance affichée en mètres puis km (ex: "0 m", "1.5 km")
		A tester dans un second temps
  - Minutes restantes calculées (basé sur durée du parcours)
		A tester dans un second temps
  - "--" affiché si données parcours non disponibles
	Ok

  5. Alerte Déviation (Story 4-6)

  - UI de l'alerte présente (toast orange en haut)
		A tester dans un second temps
  - Bouton X pour dismiss l'alerte
		A tester dans un second temps
  - Alerte ne réapparaît pas après dismiss
		A tester dans un second temps

  6. Terminer une Balade (Story 4-7)

  - Clic "Terminer" → loading state ("Enregistrement...")
	Ok
  - GPS tracking s'arrête
	Je pense ?
  - Données sauvegardées (distance, duration, geojson_track)
	Comment le verifier ?
  - Status walk → "completed"
	Ou ca ?
  - Redirection vers page summary
	Ok
  - Si erreur → toast d'erreur + tracking reprend
	Je ne sais pas ?

  7. Annuler une Balade

  - Clic "Annuler" → confirm dialog
	Ok (très moche coté UI)
  - Si confirmé → status walk → "cancelled"
	Surement ?
  - Redirection vers /explore
	Oui
  - Si annulé → reste sur WalkTracker
	Oui

  8. Page Summary/Célébration (Story 4-8)

  - Message "Bien joué !" affiché
	Ok
  - Si chien enregistré → message personnalisé ("Bien joué avec [Nom] !")
	Ok
  - Durée affichée (format "Xmin Ys" ou "Xh Ymin")
	Ok
  - Distance affichée
	Ok
  - Date de la balade affichée
	Ok
  - Animation confetti visible
	Ok
  - Bouton "Retour à l'accueil" → /
	Ok
  - Bouton "Nouvelle balade" → /explore
	Ok

  9. Mode Offline (Story 4-9)

  - Indicateur "Mode hors-ligne" si pas de connexion
		A tester dans un second temps
  - Carte reste visible (tiles cachées)
		A tester dans un second temps
  - GPS tracking continue localement
		A tester dans un second temps
  - Indicateur disparaît quand connexion revient
		A tester dans un second temps

  10. Sécurité & Validation API

  - POST /api/walks - Requiert authentification
  - GET /api/walks - Liste uniquement ses propres walks
  - GET /api/walks/[id] - 404 si walk d'un autre user
  - PATCH /api/walks/[id] - Ne peut modifier que ses walks
  - ID invalide (ex: "abc") → 400 "ID de balade invalide"
  - GeoJSON invalide → 400 "Format GeoJSON invalide"
  - GeoJSON trop gros (>500KB) → 400 "Track trop volumineux"

	Toute cette partie la doit etre couverte par des tests unitaire

  11. États Edge Cases

  - Accès /walks/[id] pour walk déjà terminée → message + lien summary
	Ok
  - Accès /walks/[id] pour walk inexistante → "Balade introuvable"
	Ok
  - Accès /walks/summary-[id] pour walk inexistante → "Balade introuvable"
	Ok
  - Refresh page pendant balade → reprend tracking
	J'ai pas tester la partie GPS mais ca a l'air de reset le temps, pas ouf

  12. Responsive & Accessibilité

  - WalkTracker fonctionne sur mobile (safe area bottom)
		A tester dans un second temps
  - Boutons assez grands (touch targets 44px+)
		A tester dans un second temps
  - Contrastes suffisants sur les stats
		A tester dans un second temps
  - Skip link "Passer la carte" fonctionne
		A tester dans un second temps

  ---
  URL de test: http://localhost:3020

  Flow principal à tester:
  1. Se connecter
  2. Aller sur /explore
  3. Cliquer sur un parcours
  4. Cliquer "C'est parti !"
  5. Attendre quelques secondes
  6. Cliquer "Terminer la balade"
  7. Vérifier la page summary