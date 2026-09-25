const simpleGit = require("simple-git");

/**
 * Kerää commit-historian annetulta polulta viimeisiltä `days` päivältä.
 * Palauttaa listan { hash, date, message, author, diffSummary } -objekteja.
 */
async function collectCommits(repoPath, days) {
  const git = simpleGit(repoPath);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`${repoPath} ei ole Git-repositorio.`);
  }

  const since = `${days}.days`;
  let log;
  try {
    log = await git.log({ "--since": since });
  } catch (err) {
    // Tuore repositorio ilman yhtäkään committia - kohdellaan samana
    // tilanteena kuin "ei committeja aikaikkunassa" sen sijaan että
    // kaadutaan raakaan Git-virheeseen.
    if (/does not have any commits yet/i.test(err.message)) {
      return [];
    }
    throw err;
  }

  const commits = [];
  for (const entry of log.all) {
    let diffSummary = "";
    try {
      // --stat antaa lyhyen yhteenvedon muutetuista tiedostoista ilman
      // koko diffin sisältöä - pitää promptin lyhyenä ja halpana.
      diffSummary = await git.show([entry.hash, "--stat", "--format="]);
    } catch (err) {
      diffSummary = "(diffiä ei saatu haettua)";
    }

    commits.push({
      hash: entry.hash.slice(0, 7),
      date: entry.date,
      message: entry.message,
      author: entry.author_name,
      diffSummary: diffSummary.trim(),
    });
  }

  return commits;
}

module.exports = { collectCommits };
