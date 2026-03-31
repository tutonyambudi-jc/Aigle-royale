# Rapport d'audit des dépendances — Aigle Royale

Date: 2026-01-24

Résumé
------
- Exécution : `npm audit --json` (résumé fourni ci-dessous).
- Total vulnérabilités détectées : 8 (1 critical, 5 high, 2 moderate).
- Actions recommandées : appliquer correctifs sûrs, tester localement, puis effectuer mises à jour majeures avec prudence et tests.

Détails des vulnérabilités et commandes proposées
------------------------------------------------

1) jspdf
- Sévérité : critical / high
- Contexte : utilisé en tant que dépendance directe (`jspdf`)
- Problèmes : ReDoS, DoS, Local File Inclusion (advisories GHSA-w532-jxjh-hjhj, GHSA-8mvj-3j78-4qmw, GHSA-f8cm-6447-x5h2)
- Fix disponible : `jspdf@4.0.0` (major)
- Commande proposée :

```bash
npm install jspdf@4.0.0
```

Remarque : `jspdf@4` est une mise à jour majeure — tester les usages (rendering, API) avant déploiement.

2) @capacitor/cli (transitif: `tar`)
- Sévérité : high
- Contexte : vulnérabilité transitive via `tar` (path traversal / arbitrary file overwrite)
- Fix disponible : mise à jour majeure du paquet CLI (audit propose `@capacitor/cli@2.5.0`) — attention aux incompatibilités avec autres packages Capacitor installés.
- Commande proposée (préférer vérifier compatibilité) :

```bash
# Mettre à jour Capacitor en cohérence (vérifier d'abord la compatibilité avec votre projet)
npm install @capacitor/cli@latest @capacitor/core@latest @capacitor/android@latest @capacitor/ios@latest
```

Remarque : si vous n'utilisez pas Capacitor en production, envisager de le retirer des dépendances de production.

3) tar (transitif)
- Sévérité : high
- Contexte : `tar` vulnérable (path sanitization, symlink poisoning)
- Résolution : se fait en mettant à jour la dépendance parent (ex: `@capacitor/cli`) ou en mettant à jour directement `tar` si présent.
- Commande proposée :

```bash
npm update tar
# ou si transitive, mettre à jour le package parent (voir point @capacitor/cli)
```

4) @next/eslint-plugin-next / eslint-config-next / glob
- Sévérité : high
- Contexte : vulnérabilité transitive via `glob` et plugins ESLint (devDependencies). `glob` a un advisory sur commande CLI injection.
- Commandes proposées :

```bash
npm install eslint-config-next@latest --save-dev
npm install @next/eslint-plugin-next@latest --save-dev
npm install glob@latest --save-dev
```

Remarque : mettre à jour les plugins de lint est généralement sûr mais vérifier les règles et tests.

5) dompurify (transitif via jspdf)
- Sévérité : moderate
- Contexte : DOMPurify XSS advisory (GHSA-vhxf-7vqr-mrjg) pour versions <3.2.4.
- Résolution : la mise à jour de `jspdf` (point 1) règle typiquement cette dépendance transitive.

6) lodash
- Sévérité : moderate
- Contexte : prototype pollution dans certaines versions anciennes (via un transitive)
- Commande proposée :

```bash
npm install lodash@latest
```

Étapes recommandées (ordre prudent)
----------------------------------
1. Commit/push current branch et créer une branche `audit/fix-deps`.
2. Exécuter :

```bash
npm ci
npm audit fix
```

3. Pour vulnérabilités résiduelles (surtout celles nécessitant mises à jour majeures), appliquer chaque correction en isolé, ex. :

```bash
npm install jspdf@4.0.0
npm install eslint-config-next@latest --save-dev @next/eslint-plugin-next@latest --save-dev
npm install @capacitor/cli@latest @capacitor/core@latest # si vous utilisez Capacitor
```

4. Lancer la suite de vérifications locales :

```bash
npm run lint
npm run build
```

5. Tester manuellement les pages/flux critiques (paiement, génération de PDF, upload, API cron).
6. Re-exécuter `npm audit --json` et vérifier que le nombre de vulnérabilités diminue.
7. Déployer sur une staging et vérifier le comportement.

Notes opérationnelles et risques
--------------------------------
- Certaines corrections nécessitent des mises à jour majeures (breaking changes). Testez en isolation.
- Si `@capacitor/*` est utilisé pour des builds mobiles, coordonner les versions Capacitor avec la plateforme mobile (Android/iOS).
- `jspdf` étant utilisé pour génération PDF/QR/tickets, vérifiez la compatibilité API après mise à jour majeure.
- Validez que `devDependencies` mis à jour (eslint, glob) ne brisent pas le CI.

Annexes
-------
- Source des alerts (extraits `npm audit`):
  - jspdf advisories: https://github.com/advisories/GHSA-w532-jxjh-hjhj, https://github.com/advisories/GHSA-8mvj-3j78-4qmw, https://github.com/advisories/GHSA-f8cm-6447-x5h2
  - dompurify advisory: https://github.com/advisories/GHSA-vhxf-7vqr-mrjg
  - glob advisory: https://github.com/advisories/GHSA-5j98-mcp5-4vw2
  - tar advisory: https://github.com/advisories/GHSA-8qq5-rm4j-mr97

---

Fichier généré automatiquement — pour corrections automatiques ou application manuelle, demandez et je peux appliquer les mises à jour sûres et re-tester `npm audit`.
