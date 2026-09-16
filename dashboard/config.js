/* ---------------------------------------------------------------------------
   Dashboard configuration.

   This is the only file you must edit after deploying the Apps Script backend.
   See apps-script/README section in ../README.md for how to get these values.
   --------------------------------------------------------------------------- */

window.DASHBOARD_CONFIG = {

  /* The Apps Script web app URL. It looks like:
     https://script.google.com/macros/s/AKfycb.....000/exec
     Leave it empty and the board runs read-only — useful for a quick preview. */
  apiUrl: "",

  /* A shared word that must match SECRET in apps-script/Code.gs.
     It is visible in this file, so it is a speed bump, not a lock: it stops a
     passer-by, not someone who reads the page source. See the "Who can write"
     section of README.md before you decide this is good enough. */
  token: "change-me",

  /* How often to pull other people's changes, in seconds.
     Polling pauses when the tab is in the background. Do not go below 10 —
     Apps Script has a daily execution quota and every poll spends one. */
  pollSeconds: 15,

  /* Where "Open tutorial" links point. {slug} is replaced. */
  tutorialUrl: "https://my.cytron.io/tutorial/{slug}"
};
