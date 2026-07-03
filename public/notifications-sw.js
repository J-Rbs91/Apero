/* Service worker minimal de la Confrérie du Petit Jaune.
 *
 * Rôle volontairement restreint : permettre l'affichage de notifications OS
 * (registration.showNotification) et rouvrir / refocaliser l'app au clic sur
 * une notification. Il ne fait ni cache offline, ni push serveur : les apéros
 * sont chiffrés de bout en bout, le serveur ne peut pas émettre de push
 * pertinent (voir README, section notifications). */

self.addEventListener("install", (event) => {
  // Prendre la main tout de suite, sans attendre une navigation.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Refocaliser un onglet déjà ouvert sur l'app si possible.
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }

      // Sinon, ouvrir l'app (l'URL est relative à la portée du SW).
      if (self.clients.openWindow) {
        await self.clients.openWindow("./");
      }
    })(),
  );
});
