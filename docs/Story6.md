  Epic 6 — Historique & Statistiques :

  1. Page Profil (/profile)
    - Le bouton "Mon historique de balades" est visible
		Oui
    - La card "Ce mois-ci" affiche les stats réelles (balades, distance, durée)
		Oui
    - Le StreakDisplay s'affiche avec le flame 🔥 et le compteur
		Oui
    - Cliquer sur le StreakDisplay déploie les 7 derniers jours (dots vert/gris)
		Il faudrait que tu fake ses données en db pour pas attendre 7 jours
    - Si aucune balade : streak = "C'est reparti !"
		Oui
  2. Page Historique (/profile/history)
    - Liste les balades terminées (date, nom parcours, durée, distance)
    - Si aucune balade : état vide "Ton historique apparaîtra ici"
    - Cliquer une balade navigue vers les détails
		Non, /profile/history ne renvoie sur rien, on reste sur la page profile
  3. Détails balade (/profile/history/[id])
    - Affiche la carte MapView, nom du parcours, date, durée, distance, statut
    - Bouton retour vers l'historique
		Pas pu tester a cause du bug du dessus
  4. Homepage (/)
    - Les stats (Balades, Parcourus, Temps total) affichent les vraies données du mois
		Il faudrait que tu les fake également
  5. Streak auto-update
    - Terminer une balade met à jour le streak automatiquement
		Oui
    - La migration 0004 doit s'appliquer (nouveaux champs streak_count, last_walk_date)
		Je ne sais pas

  ---
  Points d'attention :
  - La migration DB 0004 doit passer au déploiement (ALTER TABLE users)
  - Les pages historique/streak nécessitent d'être connecté (auth middleware)
  - Pour tester les stats/streak il faut avoir au moins une balade completed

	Attention, je ne vois pas trop la feature meteo. Il faudrait la mettre un peu plus en valeur !
	Une feature que l'on avait pas découvert mais qui me semble intéréssant, c'est que les parcours pourrait etre généré par IA sur la carte. On peut think la dessus si tu veux.

	Corrige ses bug, dis moi quand c'est bon et dis moi ou on en est glbalement dans le projet