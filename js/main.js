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
    let gameStartTime = performance.now();
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
    let expectedNextId = null; // FIX: mémorise l'indice donné au joueur

    // ─── TIMER PAUSE/RESUME SYSTEM ───
    let timerPaused = false;
    let timerPenaltyActive = false;
    let totalPausedTime = 0;
    let hintOpenAt = 0;

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

    function getEffectiveTime(){
        var now = performance.now();
        var paused = 0;
        if(timerPaused && hintOpenAt > 0){
            paused = now - hintOpenAt;
        }
        return now - gameStartTime - totalPausedTime - paused;
    }

    function getEffectiveTimeSinceLast(){
        var now = performance.now();
        var paused = 0;
        if(timerPaused && hintOpenAt > 0){
            paused = now - hintOpenAt;
        }
        return now - lastSolveTime - paused;
    }

    // ═══════════════════════════════════════════════════════
    // COMMENT POOLS — NO REPEATS EVER
    // ═══════════════════════════════════════════════════════
    const POOLS = {
        speed: {
            fulgurant: [
                "Rythme fulgurant. On dirait que vous avez peur de quelque chose. Ou que quelque chose a peur de vous.",
                "Vous courez. On ne sait pas encore si vous etes poursuivi ou simplement competent.",
                "C'est physique, ce rythme. On entend votre souris de l'autre cote du serveur.",
                "Vous ne clignez plus des yeux. C'est inquietant. Ou flatteur. On ne sait pas.",
                "A cette vitesse, on suspecte un script automatise. Ou un cafe trop fort.",
                "Vous devorez les mysteres comme des petits fours. C'est glouton, mais efficace.",
                "On a du ralentir l'enregistrement pour vous suivre. C'est du jamais vu.",
                "Votre curseur fume. Litteralement. On a verifie les logs.",
                "On n'a pas le temps de rediger entre deux clics. C'est humiliant.",
                "Vous jouez comme si la page allait disparaitre dans dix secondes. Elle ne disparait pas. On a verifie.",
                "C'est une fusee. Une fusee maladroite, mais une fusee.",
                "Vous ne lisez pas, vous scannez. Comme une machine. On adore les machines."
            ],
            rapide: [
                "Rythme soutenu. Vous apprenez vite. Ou vous avez de la chance. Dans notre metier, on ne fait pas la difference.",
                "Vous avancez comme quelqu'un qui connait le chemin. Suspect.",
                "Pas de temps mort. Pas de repit. C'est epuisant a regarder.",
                "Vous avez trouve votre rythme. Esperons que vous ne vous brulez pas les ailes.",
                "C'est rapide, mais pas panique. Le signe d'un professionnel. Ou d'un amateur chanceux.",
                "Vous ne vous arretez pas pour respirer. On espere que vous respirez quand meme.",
                "Votre souris trace des lignes droites. C'est beau. C'est inquietant.",
                "On dirait que vous avez un rendez-vous apres. On ne vous retient pas. Enfin, si."
            ],
            normal: [
                "Rythme regulier. Methodique. Presque trop methodique.",
                "Vous avancez sans vous presser. C'est soit de la confiance, soit de la fatigue.",
                "Pas d'enthousiasme debordant, pas de panique. Le genre d'agent qu'on envoie en mission de routine.",
                "Vous lisez entre les lignes. Lentement. Comme quelqu'un qui sait que le diable est dans les details.",
                "Rythme correct. On n'aime pas les horloges, mais on respecte la regularite.",
                "Vous avancez comme une horloge. On n'aime pas les horloges. Mais on respecte.",
                "Ni lent ni rapide. Vous etes le mouton de la file. Le mouton le plus regulier.",
                "Vous prenez le temps de digerer. C'est mature. Ou vous avez un autre onglet ouvert."
            ],
            lent: [
                "Rythme relenti. Vous reflechissez. C'est inquietant. On prefere quand vous reagissez sans reflechir.",
                "Vous avez fait une pause. Cafe ? Cigarette ? Crise existentielle ? On ne jugera pas.",
                "On a failli envoyer une equipe de secours. A vos frais, bien sur.",
                "Vous avancez comme un escargot. Un escargot determine, mais un escargot.",
                "On a verifie votre pouls. A distance. Il est faible, mais present.",
                "Vous avez survecu a votre propre lenteur. C'est un exploit.",
                "On a propose de vous envoyer un coussin. On a dit non. On ne sait pas pourquoi.",
                "Vous lisez chaque mot. C'est touchant. Et terriblement lent."
            ],
            tresLent: [
                "Latence significative. On a verifie votre pouls. A distance.",
                "On a failli envoyer une equipe de secours. Le candidat a fini par bouger. C'est l'essentiel.",
                "Vous avez fait une pause de plus de quarante-cinq secondes. On a verifie. A distance.",
                "Vous avancez comme un glacier. Un glacier qui fond, mais un glacier.",
                "On a envoye quelqu'un verifier. Il a refuse. On ne paie pas assez pour ca.",
                "Vous etes devenu une statue. On a propose de vous photographier pour les archives.",
                "On a commence a parier sur votre sante mentale. Les cotes sont defavorables.",
                "On a envoye un message. Vous n'avez pas repondu. On a envoye un autre. Rien. On commence a penser que vous nous ignorez.",
                "Trente minutes. On ferme. Le candidat a eu sa chance. On n'a pas que ca a faire."
            ]
        },
        order: {
            next: [
                "Progression logique. Vous suivez le fil. C'est rassurant. Trop rassurant, peut-etre.",
                "Vous lisez de gauche a droite. C'est rassurant. On apprecie la constance.",
                "Suite logique. Vous ne sautez pas d'etapes. C'est soit de la prudence, soit de la peur.",
                "Vous suivez le chemin trace. C'est le chemin le plus sur. Et le plus ennuyeux.",
                "Pas de detour. Pas de surprise. C'est efficace. C'est deprimant.",
                "Vous avancez en ligne droite. Comme une fleche. Une fleche previsible.",
                "Ordre chronologique. Vous respectez la timeline. C'est soit de la discipline, soit du manque d'imagination.",
                "Vous ne prenez pas de risque. C'est sage. On deteste la sagesse."
            ],
            prev: [
                "Approche retroactive. Vous remontez le temps. Comme un saumon. Un saumon determine.",
                "Vous reculez. C'est comme lire un livre a l'envers. Interessant, mais deconcertant.",
                "Vous remontez la page. Comme un ascenseur qui remonte apres etre descendu.",
                "Approche retrograde. Non conventionnel mais efficace. Ou confus. On ne sait pas.",
                "Vous retournez en arriere. Vous avez oublie quelque chose, ou vous cherchez quelque chose.",
                "Vous remontez le temps. On ne sait pas si c'est de la nostalgie ou de la paranoia.",
                "Vous faites demi-tour. C'est soit de la prudence, soit que vous etes perdu.",
                "Vous explorez dans le sens inverse. C'est original. On n'aime pas l'original."
            ],
            jump: [
                "Saut de progression. Vous sautez des etapes. Soit vous savez ou vous allez, soit vous fuyez quelque chose.",
                "Vous avez saute des fragments. Audacieux. Ou distrait. On parie sur les deux.",
                "Saut de progression. Vous ne respectez pas l'ordre. C'est soit de l'audace, soit de la confusion.",
                "Vous avez fait un bond. Comme un pion qui avance de trois cases. C'est illegal aux echecs.",
                "Vous ne suivez pas le fil. Vous coupez. C'est efficace. C'est suspect.",
                "Approche par bonds. Vous touchez le sol entre deux sauts. On espere.",
                "Vous avez laisse des mysteres derriere vous. Ils ne sont pas contents.",
                "Vous sautez par-dessus des indices. C'est du parkour intellectuel. Dangereux."
            ]
        },
        fragment: {
            1: [
                "Le candidat a clique sur le sceau. C'est le mystere le plus evident. On espere qu'il n'a pas cru que c'etait difficile.",
                "Fragment 1 valide. Le sceau. L'evidence meme. On ferme les yeux.",
                "Vous avez trouve le sceau. C'etait sous votre nez. Litteralement."
            ],
            2: [
                "Le candidat a clique sur 'palimpseste'. Il sait ce que ca veut dire, ou il a clique sur tous les mots soulignes.",
                "Fragment 2 valide. Le palimpseste. Un mot complique pour un clic simple.",
                "Vous avez dechiffre le palimpseste. Ou vous avez clique au hasard. On ne fait pas la difference."
            ],
            3: [
                "Le candidat a clique sur les publications dans l'ordre chronologique inverse. Il a du temps a perdre, ou il est methodique.",
                "Fragment 3 valide. Les publications. Comme un comptable. Un comptable qui espionne.",
                "Vous avez reorganise les dates. C'est le metier le plus triste que j'aie jamais vu."
            ],
            4: [
                "Le candidat a ecrit OMEGA dans un formulaire. C'est soit de l'audace, soit de la desesperance. On ne peut pas faire la difference.",
                "Fragment 4 valide. Le mot grec. Sans contexte. Sans filet.",
                "Vous avez ecrit OMEGA. C'est soit du genie, soit un appel au secours. On pencherait pour la deuxieme option."
            ],
            5: [
                "Le candidat a clique dans l'ordre sur les liens du footer. Comme s'il lisait les mentions legales. Personne ne lit les mentions legales.",
                "Fragment 5 valide. Le footer. Cette tombe ou personne ne va.",
                "Vous avez explore le footer. Dans le bon ordre. Vous etes soit tres curieux, soit tres perdu."
            ],
            6: [
                "Le candidat a clique sur l'adresse. C'est soit de la curiosite, soit de la paranoia. On ne juge pas.",
                "Fragment 6 valide. L'adresse. Soit vous etes un stalker, soit vous remarquez les details.",
                "Vous avez clique sur une adresse postale. Personne de normal ne fait ca."
            ],
            7: [
                "Triple-clic sur le copyright. Le candidat a clique comme un fou sur du texte. On espere qu'il ne fait pas ca sur tous les documents.",
                "Fragment 7 valide. Le copyright. Vous cliquez partout en esperant que quelque chose arrive.",
                "Trois clics sur un copyright. Ca a marche. Ne vous en felicitez pas. C'etait de la statistique."
            ],
            8: [
                "Clic long sur le titre. Le candidat a tenu le bouton de la souris pendant 1,5 seconde. C'est soit de la patience, soit de la paralysie.",
                "Fragment 8 valide. Le titre. Vous l'avez etrangle pendant 1,5 seconde. C'est touchant.",
                "Vous avez maintenu votre doigt sur le titre. Comme si vous essayiez de le faire avouer."
            ],
            9: [
                "Le candidat a rempli le formulaire complet. C'est le mystere le plus difficile. Soit il est brillant, soit il a clique partout au hasard.",
                "Fragment 9 valide. Le formulaire complet. Le piege le plus subtil.",
                "Vous avez rempli un formulaire entier sans savoir pourquoi. Le hasard a eu pitie de vous."
            ]
        },
        milestone: {
            2: [
                "Deux fragments. Le candidat a trouve son rythme. Esperons qu'il ne se brule pas les ailes.",
                "Deux sur neuf. Vous avez depasse le stade du hasard. On commence a croire que vous savez lire.",
                "Deux fragments. C'est un debut. Un debut qui ressemble a une suite."
            ],
            3: [
                "Trois fragments. Le candidat est toujours en vie. On est presque touche.",
                "Trois sur neuf. Un tiers. Vous n'etes pas encore un danger, mais vous n'etes plus une victime.",
                "Trois fragments. Vous avancez. C'est rassurant. Trop rassurant."
            ],
            4: [
                "La moitie est passee. Le candidat tient le coup. On commence a croire qu'il n'est pas ici par accident.",
                "Quatre sur neuf. La moitie. Vous avez survecu a votre propre curiosite. C'est un exploit.",
                "Quatre fragments. Vous etes a mi-parcours. On ne vous dira pas que la deuxieme moitie est plus difficile."
            ],
            5: [
                "Cinq fragments. Le candidat est dans le flow. On deconseille de le deranger.",
                "Cinq sur neuf. Vous avez passe le cap. Ou vous avez simplement eu de la chance cinq fois de suite.",
                "Cinq fragments. La majorite simple. Vous commencez a nous inquieter. Et nous, ca nous plait."
            ],
            6: [
                "Deux tiers. Le candidat a passe le cap difficile. Ou il a simplement eu de la chance trois fois de suite.",
                "Six sur neuf. Deux tiers. Vous etes soit competent, soit tres chanceux. On parie sur les deux.",
                "Six fragments. Vous avez depasse les deux tiers. On verifie que vous ne trichez pas."
            ],
            7: [
                "Sept fragments. Le candidat est en mode 'automatique'. On verifie qu'il cligne encore des yeux.",
                "Sept sur neuf. Vous volez. On verifie si vous n'avez pas un moteur cache quelque part.",
                "Sept fragments. Vous avez trouve le bouton 'turbo'. On ne savait pas qu'il y en avait un."
            ],
            8: [
                "Dernier fragment avant l'acces. Le candidat a presque fini. On parie qu'il pense avoir gagne. Il n'a rien gagne.",
                "Huit sur neuf. Dernier avant l'acces. Vous avez presque fini. Vous pensez avoir gagne. Vous n'avez rien gagne.",
                "Huit fragments. Il en manque un. Un seul. C'est le plus cruel."
            ]
        },
        note: [
            "Note interne : Le candidat avance. Pas de commentaire particulier. C'est deja un commentaire.",
            "Note interne : On continue de surveiller. On n'a pas que ca a faire, mais on le fait quand meme.",
            "Note interne : Le candidat semble savoir ce qu'il fait. On ne sait pas si c'est rassurant.",
            "Note interne : Pas de panique, pas d'erreur. Le genre d'agent qu'on envoie en mission de routine. Et qu'on ne recupere pas.",
            "Note interne : Le candidat lit entre les lignes. C'est son metier, ou c'est une maladie.",
            "Note interne : Rythme correct. Pas d'enthousiasme debordant. On apprecie la retenue.",
            "Note interne : On ajuste le profil. Le candidat est plus competent que prevu. Ou plus chanceux.",
            "Note interne : Le candidat explore. C'est soit de la curiosite, soit de la panique. On surveille.",
            "Note interne : Pas de signal d'alarme. Pas de signal de detresse non plus. C'est flou.",
            "Note interne : Le candidat est methodique. On ne sait pas si c'est un compliment.",
            "Note interne : On a propose d'envoyer un analyste. On a dit non. On ne sait pas pourquoi.",
            "Note interne : Le candidat a survecu a sa propre lenteur. C'est un exploit.",
            "Note interne : On commence a s'habituer a sa presence. C'est inquietant.",
            "Note interne : Le candidat ne cligne plus des yeux. On verifie les capteurs.",
            "Note interne : Pas de demande d'aide. Pas de cri. C'est soit de la confiance, soit du mutisme.",
            "Note interne : On a parie contre le candidat. On commence a regretter.",
            "Note interne : Le candidat a depasse les attentes. Les attentes etaient basses, mais quand meme.",
            "Note interne : On a envoye un message. Le candidat n'a pas repondu. On n'aime pas qu'on nous ignore.",
            "Note interne : Le candidat est toujours en vie. On est presque touche.",
            "Note interne : On a propose de le recruter. On a dit non. On ne sait pas pourquoi."
        ],
        first: {
            intro: {
                1: [
                    ["Vous avez clique sur le sceau. Le sceau qui clignote depuis dix secondes. Le sceau que meme un enfant distrait aurait trouve en moins de temps qu'il n'en faut pour le dire.",
                     "On espere que ce n'est pas representatif de votre niveau general."],
                    ["Premier contact par le sceau. C'est l'evidence incarnee. On ferme les yeux et on compte jusqu'a dix.",
                     "Vous avez commence par le plus visible. C'est prudent. Ou c'est de la lachete."]
                ],
                2: [
                    ["Vous avez clique sur palimpseste. Vous savez ce que ca veut dire, ou vous avez clique sur le seul mot souligne de la section ?",
                     "Dans les deux cas, c'est inquietant. Et on ne parle pas de votre vocabulaire."],
                    ["Premier contact par le palimpseste. Vous aimez les mots compliques. Ou les mots soulignes.",
                     "On ne sait pas lequel est pire."]
                ],
                3: [
                    ["Vous avez reorganise des publications par date. Comme un comptable. Comme un comptable qui espionne des confreries secretes.",
                     "C'est le metier le plus triste que j'aie jamais vu. Felicitations."],
                    ["Premier contact par les publications. Vous aimez l'ordre chronologique. C'est soit de la methode, soit de l'obsession.",
                     "On ne fait pas la difference. On ne veut pas."]
                ],
                4: [
                    ["Vous avez ecrit OMEGA dans un formulaire de contact. Sans raison apparente. Sans contexte. Sans filet.",
                     "C'est soit du genie absolu, soit un appel au secours deguise. On pencherait volontiers pour la deuxieme option."],
                    ["Premier contact par OMEGA. Vous ecrivez des mots grecs dans des formulaires vides. C'est soit de l'audace, soit de la desesperance.",
                     "On ne peut pas faire la difference. On ne veut pas pouvoir."]
                ],
                5: [
                    ["Vous avez clique sur les liens du footer. Dans le bon ordre. Le footer, cette tombe ou personne ne va.",
                     "Vous etes soit tres curieux, soit vous n'avez vraiment rien d'autre a faire. On parie sur les deux."],
                    ["Premier contact par le footer. Vous avez descendu la page d'un seul coup. Comme si vous aviez peur du milieu.",
                     "Le milieu n'est pas dangereux. Enfin, pas pour vous."]
                ],
                6: [
                    ["Vous avez clique sur une adresse postale. Soit vous etes un stalker professionnel, soit vous avez remarque que personne de normal ne rend son adresse cliquable.",
                     "Dans les deux cas, vous nous inquietez. Et nous, ca nous plait."],
                    ["Premier contact par l'adresse. Vous avez parcouru toute la page. C'est soit de l'endurance, soit de la desorientation.",
                     "On espere que c'est de l'endurance. On a besoin d'endurance."]
                ],
                7: [
                    ["Triple-clic sur un copyright. Vous etes le genre de personne qui clique partout en esperant que quelque chose arrive.",
                     "Ca a marche. Ne vous en felicitez pas. Ce n'etait pas de la competence, c'etait de la statistique."],
                    ["Premier contact par le copyright. Vous avez atteint le bas de la page. On espere que vous avez lu le contenu entre les deux.",
                     "On ne croit pas que vous l'avez lu. On ne croit jamais."]
                ],
                8: [
                    ["Vous avez maintenu votre doigt sur le titre pendant 1,5 seconde. Comme si vous essayiez de l'etrangler.",
                     "C'est soit de la patience, soit de la paralysie. On ne peut pas faire la difference a distance. On ne veut pas pouvoir."],
                    ["Premier contact par le titre. Vous avez commence par le sommet. C'est comme ouvrir un livre par la fin.",
                     "On ne sait pas si vous etes audacieux ou perdu. On ne veut pas savoir."]
                ],
                9: [
                    ["Vous avez rempli un formulaire entier sans savoir pourquoi. C'est le mystere le plus difficile. Le piege le plus subtil.",
                     "Soit vous etes brillant, soit vous avez clique partout au hasard et le hasard a eu pitie de vous. On parie sur la deuxieme option. Toujours."],
                    ["Premier contact par le formulaire complet. Vous avez fait le tour. C'est soit de la methode, soit de la panique.",
                     "On parie sur la panique. On gagne toujours."]
                ]
            },
            note: {
                1: [
                    "Note interne : Le candidat a commence par l'evidence. On espere que ce n'est pas representatif.",
                    "Note interne : Sceau en premier. C'est le choix du prudent. Ou du lache."
                ],
                2: [
                    "Note interne : Le candidat n'a pas suivi le chemin prevu. On ajuste le profil.",
                    "Note interne : Palimpseste en premier. Il aime les mots compliques. On surveille."
                ],
                3: [
                    "Note interne : Approche non conventionnelle. On ne sait pas encore si c'est de l'audace ou de la confusion.",
                    "Note interne : Publications en premier. Comptable ou espion. On ne fait pas la difference."
                ],
                4: [
                    "Note interne : Le candidat explore. C'est soit de la curiosite, soit de la panique. On surveille.",
                    "Note interne : OMEGA en premier. C'est soit du genie, soit de la desesperance."
                ],
                5: [
                    "Note interne : Le candidat a commence par le footer. Il a peur du milieu. On note.",
                    "Note interne : Footer en premier. Personne ne lit le footer. Sauf lui. C'est suspect."
                ],
                6: [
                    "Note interne : Le candidat a commence par l'adresse. Stalker ou detective. On ne juge pas.",
                    "Note interne : Adresse en premier. Il a parcouru toute la page. Endurance ou desorientation."
                ],
                7: [
                    "Note interne : Le candidat a commence par le copyright. Il a atteint le bas. On espere qu'il a lu entre les deux.",
                    "Note interne : Copyright en premier. Triple-clic sur du texte juridique. C'est soit de la paranoia, soit du genie."
                ],
                8: [
                    "Note interne : Le candidat a commence par le titre. Audacieux ou perdu. On ne sait pas.",
                    "Note interne : Titre en premier. C'est comme ouvrir un livre par la fin. On ne sait pas ou il va."
                ],
                9: [
                    "Note interne : Le candidat a commence par le plus difficile. Soit il est brillant, soit il a de la chance. Dans notre metier, on ne fait pas la difference.",
                    "Note interne : Formulaire complet en premier. C'est le piege le plus subtil. Il est tombe dedans. Ou il l'a declenche volontairement."
                ]
            }
        },
        final: {
            fast: [
                "Performance remarquable. Tous les fragments reunis en moins d'une minute. On dirait que vous avez deja lu le manuel. Ou que vous trichez. On ne fait pas la difference.",
                "Evaluation terminee. Performance exceptionnelle. Vous avez devore les neuf fragments comme un repas express. C'est glorieux. C'est suspect.",
                "Tous les fragments reunis en moins d'une minute. Vous n'avez meme pas cligne des yeux. On a verifie les capteurs. Vous n'avez pas cligne."
            ],
            mid: [
                "Resultat satisfaisant. Tous les fragments reunis. Acces autorise. Rythme correct. Pas de panique, pas d'eclat. Le genre d'agent qu'on envoie en mission de routine.",
                "Evaluation terminee. Resultat dans la moyenne superieure. Vous avez pris votre temps sans en abuser. C'est rare. C'est apprecie.",
                "Tous les fragments reunis. Acces autorise. Vous avez fait le travail sans fanfare. C'est professionnel. C'est ennuyeux."
            ],
            slow: [
                "Resultat acceptable malgre une latence notable. Tous les fragments reunis. Acces accorde. On ne vous dira pas qu'un stagiaire fait mieux. On vient de le faire.",
                "Evaluation terminee. Resultat acceptable. Vous avez fini par trouver. C'est le principal. On ne vous dira pas qu'un enfant de dix ans fait mieux.",
                "Tous les fragments reunis. Acces accorde. Vous avez pris votre temps. Beaucoup de temps. On a vieilli en vous regardant."
            ]
        }
    };

    // ═══════════════════════════════════════════════════════
    // GLITCH HINT SYSTEM — PATIENT PUIS IMPATIENT
    // ═══════════════════════════════════════════════════════
    var waitMessages = [
        {time: 90, msg: "Note interne : Une minute trente. Le candidat est toujours devant le message. On suppose qu'il lit. Ou qu'il admire le decor. On ne peut pas faire la difference."},
        {time: 150, msg: "Note interne : Deux minutes trente. Le candidat lit le message comme s'il etait un roman. Ce n'est pas un roman. C'est un rapport administratif. On n'aime pas les romans."},
        {time: 210, msg: "Note interne : Trois minutes trente. Le candidat est toujours la. On a verifie : son curseur bouge. Donc il est vivant. C'est rassurant."},
        {time: 300, msg: "Note interne : Cinq minutes. Le candidat a fait une pause. Cafe ? Cigarette ? Besoin de chier ? On ne jugera pas. On aimerait juste savoir."},
        {time: 420, msg: "Note interne : Sept minutes. Le candidat est devenu une statue. On a propose de le photographier pour les archives. On a dit non. On ne sait pas pourquoi."},
        {time: 600, msg: "Note interne : Dix minutes. On a commence a parier sur sa sante mentale. Les cotes sont defavorables."},
        {time: 900, msg: "Note interne : Quinze minutes. Le candidat est toujours devant le message. On a verifie l'heure. Il est trois heures du matin. On ne sait pas dans quel fuseau horaire."},
        {time: 1200, msg: "Note interne : Vingt minutes. On a envoye un message. Le candidat n'a pas repondu. On a envoye un autre. Rien. On commence a penser qu'il nous ignore. Ou qu'il matter un film en fond."},
        {time: 1500, msg: "Note interne : Vingt-cinq minutes. Le candidat est toujours la. On a propose de lui envoyer un sandwich. On a dit non. On n'a pas de budget sandwich."},
        {time: 1800, msg: "Note interne : Trente minutes. Le candidat est toujours devant le message. On a envoye un message. Il n'a pas repondu. On a envoye un autre message. Il n'a pas repondu. On commence a penser qu'il nous ignore. Ou qu'il matter un film en fond. On espere que c'est la deuxieme option."},
        {time: 1859, msg: "Note interne : Trente minutes cinquante-neuf secondes. Derniere chance. On compte jusqu'a soixante. On n'aime pas compter."}
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
                resumeTimer();
            });
        }

        var agentEl = glitchOverlay.querySelector('.glitch-agent');
        var textEl = glitchOverlay.querySelector('.glitch-text');

        currentAgentComment = agentComment;
        if(agentEl) agentEl.textContent = agentComment;
        if(textEl) textEl.textContent = clue;

        document.body.classList.add('glitch-active');
        glitchOverlay.classList.add('active');

        // Start timer pause
        pauseTimer();

        startWaitMessages();
    }

    function pauseTimer(){
        if(!timerPaused){
            timerPaused = true;
            hintOpenAt = performance.now();
        }
    }

    function resumeTimer(){
        if(timerPaused && hintOpenAt > 0){
            var elapsed = performance.now() - hintOpenAt;
            totalPausedTime += elapsed;

            // FIX: Ajuster lastSolveTime pour ne pas compter le temps de lecture d'indice
            lastSolveTime += elapsed;

            // Check if player stayed too long on this hint (5 min = 300000ms)
            if(elapsed > 300000 && !timerPenaltyActive){
                timerPenaltyActive = true;
                // Penalty will be shown in next hint via generateProgressComment
            }

            timerPaused = false;
            hintOpenAt = 0;
        }
    }

    function startWaitMessages(){
        if(waitTimer) clearInterval(waitTimer);
        waitIndex = 0;
        var startTime = Date.now();
        var agentEl = glitchOverlay ? glitchOverlay.querySelector('.glitch-agent') : null;
        var penaltyWarnedThisSession = false;

        waitTimer = setInterval(function(){
            var elapsed = (Date.now() - startTime) / 1000;

            // Check penalty at 5 minutes on THIS hint
            if(!penaltyWarnedThisSession && elapsed > 300 && !timerPenaltyActive){
                penaltyWarnedThisSession = true;
                timerPenaltyActive = true;
                if(agentEl && document.body.classList.contains('glitch-active')){
                    agentEl.textContent = currentAgentComment + '\n\n' + 
                        "⚠ ALERTE TEMPORISATION ⚠\n" +
                        "Cinq minutes sur un seul indice. C'est suspect. C'est inacceptable.\n" +
                        "A partir de maintenant, votre temps de reflexion EST comptabilise.\n" +
                        "Vous vouliez reflechir ? Reflechissez vite.";
                }
                return;
            }

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
            reactivite = "Reactivite fulgurante. Vous n'avez meme pas feint de lire la page. On respecte ce genre d'efficacite froide.";
        } else if(elapsedSec < 15){
            reactivite = "Reactivite satisfaisante. Vous avez fait semblant de lire, c'est deja ca.";
        } else if(elapsedSec < 30){
            reactivite = "Reactivite dans les normes. Vous avez hesite. On a vu. On note.";
        } else {
            reactivite = "Reactivite en dessous du seuil recommande. On a failli envoyer une equipe de secours. A vos frais, bien sur.";
        }

        var introPool = POOLS.first.intro[solvedId];
        var notePool = POOLS.first.note[solvedId];
        var intro = introPool ? pickFresh(introPool, ["Premier contact etabli.", "On n'a pas d'opinion. Encore."]) : ["Premier contact etabli.", "On n'a pas d'opinion. Encore."];
        var note = notePool ? pickFresh(notePool, "Note interne : Le candidat a commence. On surveille.") : "Note interne : Le candidat a commence. On surveille.";

        return 'DOSSIER CANDIDAT #' + dossier + '\n' +
               'PREMIER CONTACT ETABLI — FRAGMENT ' + solvedId + '/9\n\n' +
               intro[0] + '\n' + intro[1] + '\n\n' +
               'EVALUATION DE LA REACTIVITE :\n' +
               "Temps ecoule depuis l'ouverture du dossier : " + elapsedSec + 's\n' +
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

        // Order — FIX: comparer avec l'indice attendu, pas l'ordre numérique
        var lastSolved = solveOrder[solveOrder.length - 2];
        var orderType = 'jump';
        if(solvedId === expectedNextId) orderType = 'next';
        else if(solvedId < lastSolved) orderType = 'prev';

        var orderComment = pickFresh(POOLS.order[orderType], "Progression non conventionnelle. On ajuste le profil.");

        // Fragment
        var fragmentComment = pickFresh(POOLS.fragment[solvedId], "Fragment valide. Pas de commentaire particulier.");

        // Milestone
        var milestoneComment = '';
        if(POOLS.milestone[solvedCount]){
            milestoneComment = pickFresh(POOLS.milestone[solvedCount], "Fragment " + solvedCount + "/9.");
        } else {
            milestoneComment = "Fragment " + solvedCount + "/9.";
        }

        // Note
        var note = pickFresh(POOLS.note, "Note interne : Le candidat avance. On surveille.");

        // Penalty warning if active
        var penalty = '';
        if(timerPenaltyActive){
            penalty = "\n\n⚠ PENALITE ACTIVE : Votre temps de reflexion dans les indices est desormais comptabilise. Vous avez abuse de notre patience.";
        }

        return speedComment + '\n' + orderComment + '\n' + fragmentComment + '\n' + milestoneComment + '\n\n' + note + penalty;
    }

    function generateFinalComment(elapsedMs){
        var elapsedSec = Math.floor(elapsedMs / 1000);
        var dossier = 'TMP-' + Math.random().toString(36).substr(2,4).toUpperCase();
        var pool = POOLS.final.slow;
        if(elapsedSec < 60) pool = POOLS.final.fast;
        else if(elapsedSec < 120) pool = POOLS.final.mid;

        var evalText = pickFresh(pool, "Evaluation terminee. Resultat dans les normes.");

        var penalty = '';
        if(timerPenaltyActive){
            penalty = "\n\nNote interne : Le candidat a accumule des penalites de temps. On ne sait pas si c'etait de la reflexion ou de la procrastination. On ne fait pas la difference.";
        }

        return 'DOSSIER CANDIDAT #' + dossier + '\n' +
               'EVALUATION TERMINEE — 9/9 FRAGMENTS\n\n' +
               evalText + penalty + '\n\n' +
               "Le mot de passe est compose des neuf lettres dorees que vous avez collectees.\n\n" +
               "⚠ Une fois la commande executee (Ctrl+Shift+A), il n'y a plus de retour en arriere.";
    }

    // ═══════════════════════════════════════════════════════
    // CORE
    // ═══════════════════════════════════════════════════════
    function solveMystere(id){
        if(!MYSTERES[id] || MYSTERES[id].solved) return;

        var isFirst = solveOrder.length === 0;
        var now = performance.now();
        var elapsedTotal = getEffectiveTime();
        var timeSinceLast = isFirst ? elapsedTotal : getEffectiveTimeSinceLast();

        MYSTERES[id].solved = true;
        solvedLetters[id - 1] = MYSTERES[id].letter;
        solvedCount++;
        solveOrder.push(id);
        lastSolveTime = now;
        highlightLetter(id);

        var unsolved = getUnsolvedMysteries();

        if(unsolved.length === 0){
            var comment = generateFinalComment(elapsedTotal);
            showHint(comment, 'Tous les fragments sont reunis. Pour acceder aux archives : maintenez Ctrl+Shift+A');
        } else {
            var nextId = getRandomUnsolved();
            var comment;
            if(isFirst){
                comment = generateFirstContactComment(id, elapsedTotal);
            } else {
                comment = generateProgressComment(id, timeSinceLast, solvedCount);
            }
            // FIX: mettre a jour expectedNextId APRES generateProgressComment
            // pour que la comparaison dans generateProgressComment utilise
            // l'ancien indice (celui que le joueur vient de suivre)
            expectedNextId = nextId;
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
                expectedNextId = firstId;
                showHint("Premier contact. Vous avez necessite une indication initiale. Temps de reaction au-dessus du seuil recommande. Le systeme intervient.", MYSTERES[firstId].clue);
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