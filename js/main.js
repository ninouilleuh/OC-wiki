(function(){
    'use strict';

    // ═══════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════
    const MYSTERES = {
        1: { solved: false, letter: 'A', clue: "Le sceau en haut a gauche porte une date." },
        2: { solved: false, letter: 'T', clue: "Un mot dans la section Approche a ete gratte et recrit." },
        3: { solved: false, letter: 'T', clue: "Les publications cachent un ordre cache dans le temps." },
        4: { solved: false, letter: 'E', clue: "Un mot grec dans le formulaire ouvre une porte." },
        5: { solved: false, letter: 'N', clue: "Trois liens au pied de la page. Un ordre a respecter." },
        6: { solved: false, letter: 'T', clue: "L'adresse est plus qu'une adresse." },
        7: { solved: false, letter: 'I', clue: "Le bas de page se repete. Trois fois pour etre sur." },
        8: { solved: false, letter: 'O', clue: "Le titre principal aime qu'on s'y attarde." },
        9: { solved: false, letter: 'N', clue: "Le formulaire complet mene au dernier fragment." }
    };

    // ═══════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════
    let solvedCount = 0;
    const solvedLetters = ['_','_','_','_','_','_','_','_','_'];
    let gameStartTime = Date.now();
    let solveOrder = [];
    let lastSolveTime = gameStartTime;
    let idleTimer = null;
    let idleTriggered = false;
    let hintTimer = null;
    let glitchOverlay = null;
    let glitchBackdrop = null;
    let waitTimer = null;
    let waitIndex = 0;
    let currentAgentComment = '';
    let usedComments = new Set();
    let escapeBlockActive = false;

    // ═══════════════════════════════════════════════════════
    // UTILS
    // ═══════════════════════════════════════════════════════
    function highlightLetter(mysteryId){
        var els = document.querySelectorAll('.m-letter[data-m="' + mysteryId + '"]');
        els.forEach(function(el){ el.classList.add('solved'); });
    }

    function getUnsolvedMysteries(){
        var unsolved = [];
        for(var i = 1; i <= 9; i++){
            if(!MYSTERES[i].solved) unsolved.push(i);
        }
        return unsolved;
    }

    function getRandomUnsolved(){
        var unsolved = getUnsolvedMysteries();
        if(unsolved.length === 0) return null;
        return unsolved[Math.floor(Math.random() * unsolved.length)];
    }

    function pickFresh(pool, fallback){
        var available = pool.filter(function(c){ return !usedComments.has(c); });
        if(available.length === 0){
            if(fallback && !usedComments.has(fallback)){
                usedComments.add(fallback);
                return fallback;
            }
            return pool[Math.floor(Math.random() * pool.length)];
        }
        var pick = available[Math.floor(Math.random() * available.length)];
        usedComments.add(pick);
        return pick;
    }

    // ═══════════════════════════════════════════════════════
    // COMMENT POOLS — NO REPEATS EVER
    // ═══════════════════════════════════════════════════════
    const POOLS = {
        speed: {
            fulgurant: [
                "Rythme fulgurant. On dirait que vous avez peur de quelque chose. Ou que quelque chose a peur de vous.",
                "Vous courez. On ne sait pas encore si vous êtes poursuivi ou simplement compétent.",
                "C'est physique, ce rythme. On entend votre souris de l'autre côté du serveur.",
                "Vous ne clignez plus des yeux. C'est inquiétant. Ou flatteur. On ne sait pas.",
                "À cette vitesse, on suspecte un script automatisé. Ou un café trop fort.",
                "Vous dévorez les mystères comme des petits fours. C'est glouton, mais efficace.",
                "On a dû ralentir l'enregistrement pour vous suivre. C'est du jamais vu.",
                "Votre curseur fume. Littéralement. On a vérifié les logs.",
                "On n'a pas le temps de rédiger entre deux clics. C'est humiliant.",
                "Vous jouez comme si la page allait disparaître dans dix secondes. Elle ne disparaît pas. On a vérifié.",
                "C'est une fusée. Une fusée maladroite, mais une fusée.",
                "Vous ne lisez pas, vous scannez. Comme une machine. On adore les machines."
            ],
            rapide: [
                "Rythme soutenu. Vous apprenez vite. Ou vous avez de la chance. Dans notre métier, on ne fait pas la différence.",
                "Vous avancez comme quelqu'un qui connaît le chemin. Suspect.",
                "Pas de temps mort. Pas de répit. C'est épuisant à regarder.",
                "Vous avez trouvé votre rythme. Espérons que vous ne vous brûlez pas les ailes.",
                "C'est rapide, mais pas paniqué. Le signe d'un professionnel. Ou d'un amateur chanceux.",
                "Vous ne vous arrêtez pas pour respirer. On espère que vous respirez quand même.",
                "Votre souris trace des lignes droites. C'est beau. C'est inquiétant.",
                "On dirait que vous avez un rendez-vous après. On ne vous retient pas. Enfin, si."
            ],
            normal: [
                "Rythme régulier. Méthodique. Presque trop méthodique.",
                "Vous avancez sans vous presser. C'est soit de la confiance, soit de la fatigue.",
                "Pas d'enthousiasme débordant, pas de panique. Le genre d'agent qu'on envoie en mission de routine.",
                "Vous lisez entre les lignes. Lentement. Comme quelqu'un qui sait que le diable est dans les détails.",
                "Rythme correct. On n'aime pas les horloges, mais on respecte la régularité.",
                "Vous avancez comme une horloge. On n'aime pas les horloges. Mais on respecte.",
                "Ni lent ni rapide. Vous êtes le mouton de la file. Le mouton le plus régulier.",
                "Vous prenez le temps de digérer. C'est mature. Ou vous avez un autre onglet ouvert."
            ],
            lent: [
                "Rythme relenti. Vous réfléchissez. C'est inquiétant. On préfère quand vous réagissez sans réfléchir.",
                "Vous avez fait une pause. Café ? Cigarette ? Crise existentielle ? On ne jugera pas.",
                "On a failli envoyer une équipe de secours. À vos frais, bien sûr.",
                "Vous avancez comme un escargot. Un escargot déterminé, mais un escargot.",
                "On a vérifié votre pouls. À distance. Il est faible, mais présent.",
                "Vous avez survécu à votre propre lenteur. C'est un exploit.",
                "On a proposé de vous envoyer un coussin. On a dit non. On ne sait pas pourquoi.",
                "Vous lisez chaque mot. C'est touchant. Et terriblement lent."
            ],
            tresLent: [
                "Latence significative. On a vérifié votre pouls. À distance.",
                "On a failli envoyer une équipe de secours. Le candidat a fini par bouger. C'est l'essentiel.",
                "Vous avez fait une pause de plus de quarante-cinq secondes. On a vérifié. À distance.",
                "Vous avancez comme un glacier. Un glacier qui fond, mais un glacier.",
                "On a envoyé quelqu'un vérifier. Il a refusé. On ne paie pas assez pour ça.",
                "Vous êtes devenu une statue. On a proposé de vous photographier pour les archives.",
                "On a commencé à parier sur votre santé mentale. Les cotes sont défavorables.",
                "On a envoyé un message. Vous n'avez pas répondu. On a envoyé un autre. Rien. On commence à penser que vous nous ignorez.",
                "Trente minutes. On ferme. Le candidat a eu sa chance. On n'a pas que ça à faire."
            ]
        },
        order: {
            next: [
                "Progression logique. Vous suivez le fil. C'est rassurant. Trop rassurant, peut-être.",
                "Vous lisez de gauche à droite. C'est rassurant. On apprécie la constance.",
                "Suite logique. Vous ne sautez pas d'étapes. C'est soit de la prudence, soit de la peur.",
                "Vous suivez le chemin tracé. C'est le chemin le plus sûr. Et le plus ennuyeux.",
                "Pas de détour. Pas de surprise. C'est efficace. C'est déprimant.",
                "Vous avancez en ligne droite. Comme une flèche. Une flèche prévisible.",
                "Ordre chronologique. Vous respectez la timeline. C'est soit de la discipline, soit du manque d'imagination.",
                "Vous ne prenez pas de risque. C'est sage. On déteste la sagesse."
            ],
            prev: [
                "Approche rétroactive. Vous remontez le temps. Comme un saumon. Un saumon déterminé.",
                "Vous reculez. C'est comme lire un livre à l'envers. Intéressant, mais déconcertant.",
                "Vous remontez la page. Comme un ascenseur qui remonte après être descendu.",
                "Approche rétrograde. Non conventionnel mais efficace. Ou confus. On ne sait pas.",
                "Vous retournez en arrière. Vous avez oublié quelque chose, ou vous cherchez quelque chose.",
                "Vous remontez le temps. On ne sait pas si c'est de la nostalgie ou de la paranoïa.",
                "Vous faites demi-tour. C'est soit de la prudence, soit que vous êtes perdu.",
                "Vous explorez dans le sens inverse. C'est original. On n'aime pas l'original."
            ],
            jump: [
                "Saut de progression. Vous sautez des étapes. Soit vous savez où vous allez, soit vous fuyez quelque chose.",
                "Vous avez sauté des fragments. Audacieux. Ou distrait. On parie sur les deux.",
                "Saut de progression. Vous ne respectez pas l'ordre. C'est soit de l'audace, soit de la confusion.",
                "Vous avez fait un bond. Comme un pion qui avance de trois cases. C'est illégal aux échecs.",
                "Vous ne suivez pas le fil. Vous coupez. C'est efficace. C'est suspect.",
                "Approche par bonds. Vous touchez le sol entre deux sauts. On espère.",
                "Vous avez laissé des mystères derrière vous. Ils ne sont pas contents.",
                "Vous sautez par-dessus des indices. C'est du parkour intellectuel. Dangereux."
            ]
        },
        fragment: {
            1: [
                "Le candidat a cliqué sur le sceau. C'est le mystère le plus évident. On espère qu'il n'a pas cru que c'était difficile.",
                "Fragment 1 validé. Le sceau. L'évidence même. On ferme les yeux.",
                "Vous avez trouvé le sceau. C'était sous votre nez. Littéralement."
            ],
            2: [
                "Le candidat a cliqué sur 'palimpseste'. Il sait ce que ça veut dire, ou il a cliqué sur tous les mots soulignés.",
                "Fragment 2 validé. Le palimpseste. Un mot compliqué pour un clic simple.",
                "Vous avez déchiffré le palimpseste. Ou vous avez cliqué au hasard. On ne fait pas la différence."
            ],
            3: [
                "Le candidat a cliqué sur les publications dans l'ordre chronologique inverse. Il a du temps à perdre, ou il est méthodique.",
                "Fragment 3 validé. Les publications. Comme un comptable. Un comptable qui espionne.",
                "Vous avez réorganisé les dates. C'est le métier le plus triste que j'aie jamais vu."
            ],
            4: [
                "Le candidat a écrit OMEGA dans un formulaire. C'est soit de l'audace, soit de la désespérance. On ne peut pas faire la différence.",
                "Fragment 4 validé. Le mot grec. Sans contexte. Sans filet.",
                "Vous avez écrit OMEGA. C'est soit du génie, soit un appel au secours. On pencherait pour la deuxième option."
            ],
            5: [
                "Le candidat a cliqué dans l'ordre sur les liens du footer. Comme s'il lisait les mentions légales. Personne ne lit les mentions légales.",
                "Fragment 5 validé. Le footer. Cette tombe où personne ne va.",
                "Vous avez exploré le footer. Dans le bon ordre. Vous êtes soit très curieux, soit très perdu."
            ],
            6: [
                "Le candidat a cliqué sur l'adresse. C'est soit de la curiosité, soit de la paranoïa. On ne juge pas.",
                "Fragment 6 validé. L'adresse. Soit vous êtes un stalker, soit vous remarquez les détails.",
                "Vous avez cliqué sur une adresse postale. Personne de normal ne fait ça."
            ],
            7: [
                "Triple-clic sur le copyright. Le candidat a cliqué comme un fou sur du texte. On espère qu'il ne fait pas ça sur tous les documents.",
                "Fragment 7 validé. Le copyright. Vous cliquez partout en espérant que quelque chose arrive.",
                "Trois clics sur un copyright. Ça a marché. Ne vous en félicitez pas. C'était de la statistique."
            ],
            8: [
                "Clic long sur le titre. Le candidat a tenu le bouton de la souris pendant 1,5 seconde. C'est soit de la patience, soit de la paralysie.",
                "Fragment 8 validé. Le titre. Vous l'avez étranglé pendant 1,5 seconde. C'est touchant.",
                "Vous avez maintenu votre doigt sur le titre. Comme si vous essayiez de le faire avouer."
            ],
            9: [
                "Le candidat a rempli le formulaire complet. C'est le mystère le plus difficile. Soit il est brillant, soit il a cliqué partout au hasard.",
                "Fragment 9 validé. Le formulaire complet. Le piège le plus subtil.",
                "Vous avez rempli un formulaire entier sans savoir pourquoi. Le hasard a eu pitié de vous."
            ]
        },
        milestone: {
            2: [
                "Deux fragments. Le candidat a trouvé son rythme. Espérons qu'il ne se brûle pas les ailes.",
                "Deux sur neuf. Vous avez dépassé le stade du hasard. On commence à croire que vous savez lire.",
                "Deux fragments. C'est un début. Un début qui ressemble à une suite."
            ],
            3: [
                "Trois fragments. Le candidat est toujours en vie. On est presque touché.",
                "Trois sur neuf. Un tiers. Vous n'êtes pas encore un danger, mais vous n'êtes plus une victime.",
                "Trois fragments. Vous avancez. C'est rassurant. Trop rassurant."
            ],
            4: [
                "La moitié est passée. Le candidat tient le coup. On commence à croire qu'il n'est pas ici par accident.",
                "Quatre sur neuf. La moitié. Vous avez survécu à votre propre curiosité. C'est un exploit.",
                "Quatre fragments. Vous êtes à mi-parcours. On ne vous dira pas que la deuxième moitié est plus difficile."
            ],
            5: [
                "Cinq fragments. Le candidat est dans le flow. On déconseille de le déranger.",
                "Cinq sur neuf. Vous avez passé le cap. Ou vous avez simplement eu de la chance cinq fois de suite.",
                "Cinq fragments. La majorité simple. Vous commencez à nous inquiéter. Et nous, ça nous plaît."
            ],
            6: [
                "Deux tiers. Le candidat a passé le cap difficile. Ou il a simplement eu de la chance trois fois de suite.",
                "Six sur neuf. Deux tiers. Vous êtes soit compétent, soit très chanceux. On parie sur les deux.",
                "Six fragments. Vous avez dépassé les deux tiers. On vérifie que vous ne trichez pas."
            ],
            7: [
                "Sept fragments. Le candidat est en mode 'automatique'. On vérifie qu'il cligne encore des yeux.",
                "Sept sur neuf. Vous volez. On vérifie si vous n'avez pas un moteur caché quelque part.",
                "Sept fragments. Vous avez trouvé le bouton 'turbo'. On ne savait pas qu'il y en avait un."
            ],
            8: [
                "Dernier fragment avant l'accès. Le candidat a presque fini. On parie qu'il pense avoir gagné. Il n'a rien gagné.",
                "Huit sur neuf. Dernier avant l'accès. Vous avez presque fini. Vous pensez avoir gagné. Vous n'avez rien gagné.",
                "Huit fragments. Il en manque un. Un seul. C'est le plus cruel."
            ]
        },
        note: [
            "Note interne : Le candidat avance. Pas de commentaire particulier. C'est déjà un commentaire.",
            "Note interne : On continue de surveiller. On n'a pas que ça à faire, mais on le fait quand même.",
            "Note interne : Le candidat semble savoir ce qu'il fait. On ne sait pas si c'est rassurant.",
            "Note interne : Pas de panique, pas d'erreur. Le genre d'agent qu'on envoie en mission de routine. Et qu'on ne récupère pas.",
            "Note interne : Le candidat lit entre les lignes. C'est son métier, ou c'est une maladie.",
            "Note interne : Rythme correct. Pas d'enthousiasme débordant. On apprécie la retenue.",
            "Note interne : On ajuste le profil. Le candidat est plus compétent que prévu. Ou plus chanceux.",
            "Note interne : Le candidat explore. C'est soit de la curiosité, soit de la panique. On surveille.",
            "Note interne : Pas de signal d'alarme. Pas de signal de détresse non plus. C'est flou.",
            "Note interne : Le candidat est méthodique. On ne sait pas si c'est un compliment.",
            "Note interne : On a proposé d'envoyer un analyste. On a dit non. On ne sait pas pourquoi.",
            "Note interne : Le candidat a survécu à sa propre lenteur. C'est un exploit.",
            "Note interne : On commence à s'habituer à sa présence. C'est inquiétant.",
            "Note interne : Le candidat ne cligne plus des yeux. On vérifie les capteurs.",
            "Note interne : Pas de demande d'aide. Pas de cri. C'est soit de la confiance, soit du mutisme.",
            "Note interne : On a parié contre le candidat. On commence à regretter.",
            "Note interne : Le candidat a dépassé les attentes. Les attentes étaient basses, mais quand même.",
            "Note interne : On a envoyé un message. Le candidat n'a pas répondu. On n'aime pas qu'on nous ignore.",
            "Note interne : Le candidat est toujours en vie. On est presque touché.",
            "Note interne : On a proposé de le recruter. On a dit non. On ne sait pas pourquoi."
        ],
        first: {
            intro: {
                1: [
                    ["Vous avez cliqué sur le sceau. Le sceau qui clignote depuis dix secondes. Le sceau que même un enfant distrait aurait trouvé en moins de temps qu'il n'en faut pour le dire.",
                     "On espère que ce n'est pas représentatif de votre niveau général."],
                    ["Premier contact par le sceau. C'est l'évidence incarnée. On ferme les yeux et on compte jusqu'à dix.",
                     "Vous avez commencé par le plus visible. C'est prudent. Ou c'est de la lâcheté."]
                ],
                2: [
                    ["Vous avez cliqué sur « palimpseste ». Vous savez ce que ça veut dire, ou vous avez cliqué sur le seul mot souligné de la section ?",
                     "Dans les deux cas, c'est inquiétant. Et on ne parle pas de votre vocabulaire."],
                    ["Premier contact par le palimpseste. Vous aimez les mots compliqués. Ou les mots soulignés.",
                     "On ne sait pas lequel est pire."]
                ],
                3: [
                    ["Vous avez réorganisé des publications par date. Comme un comptable. Comme un comptable qui espionne des confréries secrètes.",
                     "C'est le métier le plus triste que j'aie jamais vu. Félicitations."],
                    ["Premier contact par les publications. Vous aimez l'ordre chronologique. C'est soit de la méthode, soit de l'obsession.",
                     "On ne fait pas la différence. On ne veut pas."]
                ],
                4: [
                    ["Vous avez écrit « OMEGA » dans un formulaire de contact. Sans raison apparente. Sans contexte. Sans filet.",
                     "C'est soit du génie absolu, soit un appel au secours déguisé. On pencherait volontiers pour la deuxième option."],
                    ["Premier contact par OMEGA. Vous écrivez des mots grecs dans des formulaires vides. C'est soit de l'audace, soit de la désespérance.",
                     "On ne peut pas faire la différence. On ne veut pas pouvoir."]
                ],
                5: [
                    ["Vous avez cliqué sur les liens du footer. Dans le bon ordre. Le footer, cette tombe où personne ne va.",
                     "Vous êtes soit très curieux, soit vous n'avez vraiment rien d'autre à faire. On parie sur les deux."],
                    ["Premier contact par le footer. Vous avez descendu la page d'un seul coup. Comme si vous aviez peur du milieu.",
                     "Le milieu n'est pas dangereux. Enfin, pas pour vous."]
                ],
                6: [
                    ["Vous avez cliqué sur une adresse postale. Soit vous êtes un stalker professionnel, soit vous avez remarqué que personne de normal ne rend son adresse cliquable.",
                     "Dans les deux cas, vous nous inquiétez. Et nous, ça nous plaît."],
                    ["Premier contact par l'adresse. Vous avez parcouru toute la page. C'est soit de l'endurance, soit de la désorientation.",
                     "On espère que c'est de l'endurance. On a besoin d'endurance."]
                ],
                7: [
                    ["Triple-clic sur un copyright. Vous êtes le genre de personne qui clique partout en espérant que quelque chose arrive.",
                     "Ça a marché. Ne vous en félicitez pas. Ce n'était pas de la compétence, c'était de la statistique."],
                    ["Premier contact par le copyright. Vous avez atteint le bas de la page. On espère que vous avez lu le contenu entre les deux.",
                     "On ne croit pas que vous l'avez lu. On ne croit jamais."]
                ],
                8: [
                    ["Vous avez maintenu votre doigt sur le titre pendant 1,5 seconde. Comme si vous essayiez de l'étrangler.",
                     "C'est soit de la patience, soit de la paralysie. On ne peut pas faire la différence à distance. On ne veut pas pouvoir."],
                    ["Premier contact par le titre. Vous avez commencé par le sommet. C'est comme ouvrir un livre par la fin.",
                     "On ne sait pas si vous êtes audacieux ou perdu. On ne veut pas savoir."]
                ],
                9: [
                    ["Vous avez rempli un formulaire entier sans savoir pourquoi. C'est le mystère le plus difficile. Le piège le plus subtil.",
                     "Soit vous êtes brillant, soit vous avez cliqué partout au hasard et le hasard a eu pitié de vous. On parie sur la deuxième option. Toujours."],
                    ["Premier contact par le formulaire complet. Vous avez fait le tour. C'est soit de la méthode, soit de la panique.",
                     "On parie sur la panique. On gagne toujours."]
                ]
            },
            note: {
                1: [
                    "Note interne : Le candidat a commencé par l'évidence. On espère que ce n'est pas représentatif.",
                    "Note interne : Sceau en premier. C'est le choix du prudent. Ou du lâche."
                ],
                2: [
                    "Note interne : Le candidat n'a pas suivi le chemin prévu. On ajuste le profil.",
                    "Note interne : Palimpseste en premier. Il aime les mots compliqués. On surveille."
                ],
                3: [
                    "Note interne : Approche non conventionnelle. On ne sait pas encore si c'est de l'audace ou de la confusion.",
                    "Note interne : Publications en premier. Comptable ou espion. On ne fait pas la différence."
                ],
                4: [
                    "Note interne : Le candidat explore. C'est soit de la curiosité, soit de la panique. On surveille.",
                    "Note interne : OMEGA en premier. C'est soit du génie, soit de la désespérance."
                ],
                5: [
                    "Note interne : Le candidat a commencé par le footer. Il a peur du milieu. On note.",
                    "Note interne : Footer en premier. Personne ne lit le footer. Sauf lui. C'est suspect."
                ],
                6: [
                    "Note interne : Le candidat a commencé par l'adresse. Stalker ou détective. On ne juge pas.",
                    "Note interne : Adresse en premier. Il a parcouru toute la page. Endurance ou désorientation."
                ],
                7: [
                    "Note interne : Le candidat a commencé par le copyright. Il a atteint le bas. On espère qu'il a lu entre les deux.",
                    "Note interne : Copyright en premier. Triple-clic sur du texte juridique. C'est soit de la paranoïa, soit du génie."
                ],
                8: [
                    "Note interne : Le candidat a commencé par le titre. Audacieux ou perdu. On ne sait pas.",
                    "Note interne : Titre en premier. C'est comme ouvrir un livre par la fin. On ne sait pas où il va."
                ],
                9: [
                    "Note interne : Le candidat a commencé par le plus difficile. Soit il est brillant, soit il a de la chance. Dans notre métier, on ne fait pas la différence.",
                    "Note interne : Formulaire complet en premier. C'est le piège le plus subtil. Il est tombé dedans. Ou il l'a déclenché volontairement."
                ]
            }
        },
        final: {
            fast: [
                "Performance remarquable. Tous les fragments réunis en moins d'une minute. On dirait que vous avez déjà lu le manuel. Ou que vous trichez. On ne fait pas la différence.",
                "Évaluation terminée. Performance exceptionnelle. Vous avez dévoré les neuf fragments comme un repas express. C'est glorieux. C'est suspect.",
                "Tous les fragments réunis en moins d'une minute. Vous n'avez même pas cligné des yeux. On a vérifié les capteurs. Vous n'avez pas cligné."
            ],
            mid: [
                "Résultat satisfaisant. Tous les fragments réunis. Accès autorisé. Rythme correct. Pas de panique, pas d'éclat. Le genre d'agent qu'on envoie en mission de routine.",
                "Évaluation terminée. Résultat dans la moyenne supérieure. Vous avez pris votre temps sans en abuser. C'est rare. C'est apprécié.",
                "Tous les fragments réunis. Accès autorisé. Vous avez fait le travail sans fanfare. C'est professionnel. C'est ennuyeux."
            ],
            slow: [
                "Résultat acceptable malgré une latence notable. Tous les fragments réunis. Accès accordé. On ne vous dira pas qu'un stagiaire fait mieux. On vient de le faire.",
                "Évaluation terminée. Résultat acceptable. Vous avez fini par trouver. C'est le principal. On ne vous dira pas qu'un enfant de dix ans fait mieux.",
                "Tous les fragments réunis. Accès accordé. Vous avez pris votre temps. Beaucoup de temps. On a vieilli en vous regardant."
            ]
        }
    };

    // ═══════════════════════════════════════════════════════
    // GLITCH HINT SYSTEM — ATTENDANT ET IMPATIENT
    // ═══════════════════════════════════════════════════════
    var waitMessages = [
        {time: 60, msg: "Note interne : Une minute. Le candidat est toujours devant le message. On suppose qu'il lit. Ou qu'il fait semblant. On ne peut pas faire la différence."},
        {time: 90, msg: "Note interne : Une minute trente. Le candidat est toujours là. On a vérifié : son curseur bouge. Donc il est vivant. C'est rassurant."},
        {time: 120, msg: "Note interne : Deux minutes. Le candidat lit le message comme s'il était un roman. Ce n'est pas un roman. C'est un rapport administratif. On n'aime pas les romans."},
        {time: 180, msg: "Note interne : Trois minutes. On a envoyé quelqu'un vérifier. Il a refusé. On ne paie pas assez pour ça."},
        {time: 240, msg: "Note interne : Quatre minutes. Le candidat a fait une pause. Café ? Cigarette ? Besoin de chier ? On ne jugera pas. On aimerait juste savoir."},
        {time: 300, msg: "Note interne : Cinq minutes. Le candidat est devenu une statue. On a proposé de le photographier pour les archives. On a dit non. On ne sait pas pourquoi."},
        {time: 420, msg: "Note interne : Sept minutes. On a commencé à parier sur sa santé mentale. Les cotes sont défavorables."},
        {time: 600, msg: "Note interne : Dix minutes. Le candidat est toujours devant le message. On a vérifié l'heure. Il est trois heures du matin. On ne sait pas dans quel fuseau horaire."},
        {time: 900, msg: "Note interne : Quinze minutes. Le candidat a soit trouvé quelque chose d'important, soit il s'est endormi debout. Dans les deux cas, c'est inquiétant."},
        {time: 1200, msg: "Note interne : Vingt minutes. On a envoyé un message. Le candidat n'a pas répondu. On a envoyé un autre. Rien. On commence à penser qu'il nous ignore. Ou qu'il a une urgence familiale. On espère que c'est la deuxième option."},
        {time: 1500, msg: "Note interne : Vingt-cinq minutes. Le candidat est toujours là. On a proposé de lui envoyer un sandwich. On a dit non. On n'a pas de budget sandwich."},
        {time: 1800, msg: "Note interne : Trente minutes. Le candidat est toujours devant le message. On a envoyé un message. Il n'a pas répondu. On a envoyé un autre message. Il n'a pas répondu. On commence à penser qu'il nous ignore. Ou qu'il matter un film en fond. On espère que c'est la deuxième option."},
        {time: 1801, msg: "Note interne : Trente minutes et une seconde. C'est fini. On ferme. Le candidat a eu sa chance. On n'a pas que ça à faire. Fermeture de session."}
    ];

    function showHint(agentComment, clue){
        if(hintTimer){
            clearTimeout(hintTimer);
            hintTimer = null;
        }
        stopWaitMessages();

        if(!glitchBackdrop){
            glitchBackdrop = document.createElement('div');
            glitchBackdrop.className = 'glitch-backdrop';
            document.body.appendChild(glitchBackdrop);
        }

        if(!glitchOverlay){
            glitchOverlay = document.createElement('div');
            glitchOverlay.className = 'glitch-overlay';
            glitchOverlay.innerHTML = '<div class="glitch-message"><div class="glitch-agent"></div><div class="glitch-text"></div><div class="glitch-close">[ CLIQUEZ POUR FERMER ]</div></div>';
            document.body.appendChild(glitchOverlay);

            glitchOverlay.addEventListener('click', function(e){
                e.stopPropagation();
                document.body.classList.remove('glitch-active');
                glitchOverlay.classList.remove('active');
                stopWaitMessages();
            });
        }

        var agentEl = glitchOverlay.querySelector('.glitch-agent');
        var textEl = glitchOverlay.querySelector('.glitch-text');

        currentAgentComment = agentComment;
        if(agentEl) agentEl.textContent = agentComment;
        if(textEl) textEl.textContent = clue;

        document.body.classList.add('glitch-active');
        glitchOverlay.classList.add('active');

        startWaitMessages();
    }

    function startWaitMessages(){
        if(waitTimer) clearInterval(waitTimer);
        waitIndex = 0;
        var startTime = Date.now();
        var agentEl = glitchOverlay ? glitchOverlay.querySelector('.glitch-agent') : null;

        waitTimer = setInterval(function(){
            var elapsed = (Date.now() - startTime) / 1000;
            if(waitIndex < waitMessages.length && elapsed >= waitMessages[waitIndex].time){
                if(agentEl && document.body.classList.contains('glitch-active')){
                    agentEl.textContent = currentAgentComment + '\n\n' + waitMessages[waitIndex].msg;
                }
                waitIndex++;
                if(waitIndex >= waitMessages.length){
                    clearInterval(waitTimer);
                    waitTimer = null;
                    setTimeout(function(){
                        window.location.href = 'about:blank';
                    }, 2000);
                }
            }
        }, 1000);
    }

    function stopWaitMessages(){
        if(waitTimer){
            clearInterval(waitTimer);
            waitTimer = null;
        }
        waitIndex = 0;
    }

    // ═══════════════════════════════════════════════════════
    // COMMENT GENERATORS
    // ═══════════════════════════════════════════════════════
    function generateFirstContactComment(solvedId, elapsedMs){
        var elapsedSec = Math.floor(elapsedMs / 1000);
        var dossier = 'TMP-' + Math.random().toString(36).substr(2,4).toUpperCase();

        var reactivite = '';
        if(elapsedSec < 5){
            reactivite = "Réactivité fulgurante. Vous n'avez même pas feint de lire la page. On respecte ce genre d'efficacité froide.";
        } else if(elapsedSec < 15){
            reactivite = "Réactivité satisfaisante. Vous avez fait semblant de lire, c'est déjà ça.";
        } else if(elapsedSec < 30){
            reactivite = "Réactivité dans les normes. Vous avez hésité. On a vu. On note.";
        } else {
            reactivite = "Réactivité en dessous du seuil recommandé. On a failli envoyer une équipe de secours. À vos frais, bien sûr.";
        }

        var introPool = POOLS.first.intro[solvedId];
        var notePool = POOLS.first.note[solvedId];
        var intro = introPool ? pickFresh(introPool, ["Premier contact établi.", "On n'a pas d'opinion. Encore."]) : ["Premier contact établi.", "On n'a pas d'opinion. Encore."];
        var note = notePool ? pickFresh(notePool, "Note interne : Le candidat a commencé. On surveille.") : "Note interne : Le candidat a commencé. On surveille.";

        return 'DOSSIER CANDIDAT #' + dossier + '\n' +
               'PREMIER CONTACT ÉTABLI — FRAGMENT ' + solvedId + '/9\n\n' +
               intro[0] + '\n' + intro[1] + '\n\n' +
               'ÉVALUATION DE LA RÉACTIVITÉ :\n' +
               "Temps écoulé depuis l'ouverture du dossier : " + elapsedSec + 's\n' +
               reactivite + '\n\n' +
               note + '\n\n' +
               'FRAGMENT ' + solvedId + ' VALIDÉ : ' + MYSTERES[solvedId].letter;
    }

    function generateProgressComment(solvedId, timeSinceLastMs, solvedCount){
        var timeSec = timeSinceLastMs / 1000;

        // Speed
        var speedLabel = '';
        if(timeSec < 3) speedLabel = 'fulgurant';
        else if(timeSec < 8) speedLabel = 'rapide';
        else if(timeSec < 20) speedLabel = 'normal';
        else if(timeSec < 40) speedLabel = 'lent';
        else speedLabel = 'tresLent';

        var speedComment = pickFresh(POOLS.speed[speedLabel], "Le candidat avance. Pas de commentaire sur la vitesse.");

        // Order
        var lastSolved = solveOrder[solveOrder.length - 2];
        var orderType = 'jump';
        if(solvedId === lastSolved + 1) orderType = 'next';
        else if(solvedId < lastSolved) orderType = 'prev';

        var orderComment = pickFresh(POOLS.order[orderType], "Progression non conventionnelle. On ajuste le profil.");

        // Fragment
        var fragmentComment = pickFresh(POOLS.fragment[solvedId], "Fragment validé. Pas de commentaire particulier.");

        // Milestone
        var milestoneComment = '';
        if(POOLS.milestone[solvedCount]){
            milestoneComment = pickFresh(POOLS.milestone[solvedCount], "Fragment " + solvedCount + "/9.");
        } else {
            milestoneComment = "Fragment " + solvedCount + "/9.";
        }

        // Note
        var note = pickFresh(POOLS.note, "Note interne : Le candidat avance. On surveille.");

        return speedComment + '\n' + orderComment + '\n' + fragmentComment + '\n' + milestoneComment + '\n\n' + note;
    }

    function generateFinalComment(elapsedMs){
        var elapsedSec = Math.floor(elapsedMs / 1000);
        var dossier = 'TMP-' + Math.random().toString(36).substr(2,4).toUpperCase();
        var pool = POOLS.final.slow;
        if(elapsedSec < 60) pool = POOLS.final.fast;
        else if(elapsedSec < 120) pool = POOLS.final.mid;

        var evalText = pickFresh(pool, "Évaluation terminée. Résultat dans les normes.");

        return 'DOSSIER CANDIDAT #' + dossier + '\n' +
               'ÉVALUATION TERMINÉE — 9/9 FRAGMENTS\n\n' +
               evalText + '\n\n' +
               "Le mot de passe est composé des neuf lettres dorées que vous avez collectées.\n\n" +
               "⚠ Une fois la commande exécutée (Ctrl+Shift+A), il n'y a plus de retour en arrière.";
    }

    // ═══════════════════════════════════════════════════════
    // CORE
    // ═══════════════════════════════════════════════════════
    function solveMystere(id){
        if(!MYSTERES[id] || MYSTERES[id].solved) return;

        var isFirst = solveOrder.length === 0;
        var now = Date.now();
        var elapsedTotal = now - gameStartTime;
        var timeSinceLast = isFirst ? elapsedTotal : (now - lastSolveTime);

        MYSTERES[id].solved = true;
        solvedLetters[id - 1] = MYSTERES[id].letter;
        solvedCount++;
        solveOrder.push(id);
        lastSolveTime = now;
        highlightLetter(id);

        var unsolved = getUnsolvedMysteries();

        if(unsolved.length === 0){
            var comment = generateFinalComment(elapsedTotal);
            showHint(comment, 'Tous les fragments sont réunis. Pour accéder aux archives : maintenez Ctrl+Shift+A');
        } else {
            var nextId = getRandomUnsolved();
            var comment;
            if(isFirst){
                comment = generateFirstContactComment(id, elapsedTotal);
            } else {
                comment = generateProgressComment(id, timeSinceLast, solvedCount);
            }
            showHint(comment, MYSTERES[nextId].clue);
        }
    }

    // ═══════════════════════════════════════════════════════
    // IDLE TIMER (30s hint if 0 solved)
    // ═══════════════════════════════════════════════════════
    function startIdleTimer(){
        if(idleTriggered || solvedCount > 0) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function(){
            if(solvedCount === 0 && !idleTriggered){
                idleTriggered = true;
                var firstId = Math.floor(Math.random() * 9) + 1;
                showHint("Premier contact. Vous avez nécessité une indication initiale. Temps de réaction au-dessus du seuil recommandé. Le système intervient.", MYSTERES[firstId].clue);
            }
        }, 30000);
    }

    ['click','scroll','keydown','mousemove'].forEach(function(evt){
        document.addEventListener(evt, startIdleTimer, {passive:true});
    });
    startIdleTimer();

    // ═══════════════════════════════════════════════════════
    // MYSTERY I — Header Seal (click)
    // ═══════════════════════════════════════════════════════
    var headerSeal = document.getElementById('headerSeal');
    if(headerSeal){
        headerSeal.addEventListener('click', function(){
            solveMystere(1);
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY II — Palimpseste (click)
    // ═══════════════════════════════════════════════════════
    var egg2 = document.getElementById('egg2');
    if(egg2){
        egg2.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            solveMystere(2);
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY III — Publications (reverse chronological)
    // Oct 1919 -> Jan 1920 -> Mars 1920
    // ═══════════════════════════════════════════════════════
    var pubSequence = [];
    var pubOrder = ['pub3', 'pub2', 'pub1'];
    var pubCards = document.querySelectorAll('.pub-card');
    pubCards.forEach(function(card){
        card.addEventListener('click', function(){
            pubSequence.push(this.id);
            if(pubSequence.length > 3) pubSequence.shift();
            if(pubSequence.join(',') === pubOrder.join(',')){
                solveMystere(3);
                pubSequence = [];
            }
        });
    });

    // ═══════════════════════════════════════════════════════
    // MYSTERY IV — Form (OMEGA)
    // ═══════════════════════════════════════════════════════
    var messageField = document.getElementById('message');
    var submitBtn = document.getElementById('submitBtn');
    if(messageField && submitBtn){
        messageField.addEventListener('input', function(){
            if(this.value.toUpperCase().includes('OMEGA')){
                submitBtn.style.background = '#b89b6a';
                submitBtn.style.color = '#0a0908';
                if(!MYSTERES[4].solved){
                    solveMystere(4);
                }
            } else {
                submitBtn.style.background = '';
                submitBtn.style.color = '';
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY V — Footer (L->M->R)
    // ═══════════════════════════════════════════════════════
    var footerSequence = [];
    var footerOrder = ['footerLegal', 'footerPrivacy', 'footerAccess'];
    var footerLinks = document.querySelectorAll('.footer-links a, .footer-links span');
    footerLinks.forEach(function(link){
        link.addEventListener('click', function(e){
            footerSequence.push(this.id);
            if(footerSequence.length > 3) footerSequence.shift();
            if(footerSequence.join(',') === footerOrder.join(',')){
                solveMystere(5);
                footerSequence = [];
            }
        });
    });

    // ═══════════════════════════════════════════════════════
    // MYSTERY VI — Address (click)
    // ═══════════════════════════════════════════════════════
    var addressBlock = document.getElementById('addressBlock');
    if(addressBlock){
        addressBlock.addEventListener('click', function(){
            solveMystere(6);
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY VII — Copyright (triple-click)
    // ═══════════════════════════════════════════════════════
    var copyClicks = 0;
    var copyTimer = null;
    var footerCopy = document.getElementById('footerCopy');
    if(footerCopy){
        footerCopy.addEventListener('click', function(){
            copyClicks++;
            if(!copyTimer){
                copyTimer = setTimeout(function(){
                    copyClicks = 0;
                    copyTimer = null;
                }, 600);
            }
            if(copyClicks >= 3){
                clearTimeout(copyTimer);
                copyClicks = 0;
                copyTimer = null;
                solveMystere(7);
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY VIII — Hero title (long press 1.5s)
    // ═══════════════════════════════════════════════════════
    var heroTitle = document.querySelector('.hero h1');
    var titlePressTimer = null;
    if(heroTitle){
        heroTitle.addEventListener('mousedown', function(){
            titlePressTimer = setTimeout(function(){
                solveMystere(8);
                titlePressTimer = null;
            }, 1500);
        });
        heroTitle.addEventListener('mouseup', function(){
            if(titlePressTimer){
                clearTimeout(titlePressTimer);
                titlePressTimer = null;
            }
        });
        heroTitle.addEventListener('mouseleave', function(){
            if(titlePressTimer){
                clearTimeout(titlePressTimer);
                titlePressTimer = null;
            }
        });
        heroTitle.addEventListener('touchstart', function(e){
            e.preventDefault();
            titlePressTimer = setTimeout(function(){
                solveMystere(8);
                titlePressTimer = null;
            }, 1500);
        });
        heroTitle.addEventListener('touchend', function(){
            if(titlePressTimer){
                clearTimeout(titlePressTimer);
                titlePressTimer = null;
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // MYSTERY IX — Complete form submit
    // ═══════════════════════════════════════════════════════
    var contactForm = document.getElementById('contactForm');
    var nomField = document.getElementById('nom');
    var emailField = document.getElementById('email');
    var objetField = document.getElementById('objet');

    if(contactForm){
        contactForm.addEventListener('submit', function(e){
            e.preventDefault();
            if(nomField && nomField.value.trim() &&
               emailField && emailField.value.trim() &&
               objetField && objetField.value &&
               messageField && messageField.value.trim()){
                if(!MYSTERES[9].solved){
                    solveMystere(9);
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // SECRET OVERLAY
    // ═══════════════════════════════════════════════════════
    var secretOverlay = document.getElementById('secretOverlay');
    var secretInput = document.getElementById('secretInput');
    var secretError = document.getElementById('secretError');
    var lockId = document.getElementById('lockId');

    function activateSecretMode(){
        if(!secretOverlay) return;
        history.pushState(null, null, location.href);
        window.onpopstate = function(){
            history.pushState(null, null, location.href);
        };
        if(lockId){
            lockId.textContent = 'TMP-' + Math.random().toString(36).substr(2,6).toUpperCase();
        }
        secretOverlay.style.display = 'flex';
        void secretOverlay.offsetWidth;
        secretOverlay.classList.add('active');
        setTimeout(function(){
            if(secretInput) secretInput.focus();
        }, 800);
        escapeBlockActive = true;
        document.addEventListener('keydown', blockEscape, true);
        document.addEventListener('click', blockClick, true);
    }

    function blockEscape(e){
        if(!escapeBlockActive) return;
        if(e.key === 'Escape' || e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')){
            e.preventDefault();
            e.stopPropagation();
        }
        if(e.key === 'Backspace' && secretInput && secretInput.value.length === 0){
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function blockClick(e){
        if(!escapeBlockActive) return;
        if(!e.target.closest('.secret-content')){
            e.preventDefault();
            e.stopPropagation();
        }
    }

    // Ctrl+Shift+A shortcut
    document.addEventListener('keydown', function(e){
        if(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a'){
            e.preventDefault();
            activateSecretMode();
        }
    });

    // Auth
    var VALID_CODES = [
        'NOXLEY','DINKELMANN','MERES','VOYAGEUSE',
        'ARCHIVISTE','ADMIN','OFFICE','OMEGA7','OMEGA-7',
        'ATTENTION'
    ];

    if(secretInput){
        secretInput.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){
                e.preventDefault();
                var raw = secretInput.value.trim().toUpperCase();
                var code = raw.replace(/-/g, '');

                if(VALID_CODES.includes(raw) || VALID_CODES.includes(code)){
                    if(secretOverlay){
                        secretOverlay.innerHTML =
                            '<div class="secret-content" style="animation:fadeInUp 1s ease forwards;">' +
                            '<div class="secret-seal" style="animation:none;">&#9672;</div>' +
                            '<div class="secret-title" style="color:#d4b896;">Acces Autorise</div>' +
                            '<div class="secret-text">Bienvenue, Agent ' + raw + '.<br>Chargement des archives en cours...</div>' +
                            '</div>';
                    }
                    escapeBlockActive = false;
                    setTimeout(function(){
                        window.location.href = 'index-monde.html';
                    }, 2000);
                } else {
                    if(secretError) secretError.classList.add('visible');
                    secretInput.value = '';
                    secretInput.style.borderColor = '#6b2a2a';
                    setTimeout(function(){
                        if(secretError) secretError.classList.remove('visible');
                        secretInput.style.borderColor = '';
                    }, 2500);
                }
            }
        });
    }

    // Konami code
    var konamiSequence = [];
    var KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    document.addEventListener('keydown', function(e){
        konamiSequence.push(e.key);
        if(konamiSequence.length > KONAMI.length) konamiSequence.shift();
        if(konamiSequence.join(',') === KONAMI.join(',')){
            activateSecretMode();
            konamiSequence = [];
        }
    });

    // ═══════════════════════════════════════════════════════
    // STARTUP PULSE
    // ═══════════════════════════════════════════════════════
    var headerSealPulse = document.getElementById('headerSeal');
    if(headerSealPulse){
        headerSealPulse.classList.add('pulse-start');
        setTimeout(function(){
            headerSealPulse.classList.remove('pulse-start');
        }, 10000);
    }

})();
