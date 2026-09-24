Pile vs File, et Arbre Binaire de Recherche (ABR)

1. Pile (Stack) — LIFO

Principe : Last In, First Out — le dernier élément ajouté est le premier retiré.
Comme une pile d'assiettes : on empile et on dépile par le sommet.

Opérations :

· push(x) : empiler (ajouter au sommet)
· pop() : dépiler (retirer le sommet)
· peek() / top() : consulter le sommet sans retirer

```python
pile = []
pile.append(1)   # push
pile.append(2)
pile.pop()       # retourne 2 (dernier entré)
```

Usages : historique (undo), appels récursifs, parcours en profondeur (DFS), évaluation d'expressions.

2. File (Queue) — FIFO

Principe : First In, First Out — le premier élément ajouté est le premier retiré.
Comme une file d'attente au guichet.

Opérations :

· enqueue(x) : enfiler (ajouter à la fin)
· dequeue() : défiler (retirer au début)
· front() : consulter le premier

```python
from collections import deque
file = deque()
file.append(1)    # enqueue
file.append(2)
file.popleft()    # retourne 1 (premier entré)
```

Usages : gestion de tâches, impression, parcours en largeur (BFS), files d'attente réseau.

Comparaison

Critère | Pile | File
Ordre   | LIFO | FIFO
Ajout   | Sommet | Fin
Retrait | Sommet | Début
Analogie|Pile d'assiettes | File d'attente
Parcours graphe | DFS  | BFS




Définition

Un arbre binaire est une structure où chaque nœud a au plus 2 enfants (gauche et droite).

Un ABR (ou BST, Binary Search Tree) est un arbre binaire vérifiant la propriété d'ordre :

Pour tout nœud : toutes les valeurs du sous-arbre gauche sont inférieures à la valeur du nœud, et toutes celles du sous-arbre droit sont supérieures

    


Elle donne une borne supérieure : le comportement dans le pire cas, en ignorant les constantes et les termes de faible ordre.

Exemple : f(n) = 3n² + 5n + 100 → O(n²)

· On garde le terme dominant (3n²)
· On ignore le coefficient (3)
· Les termes 5n et 100 deviennent négligeables quand n grandit

2. Les complexités courantes (de la meilleure à la pire)

Notation Nom Exemple typique
O(1) Constante Accès à un tableau par index
O(log n) Logarithmique Recherche dichotomique, B-arbre
O(n) Linéaire Parcours d'une liste
O(n log n) Quasi-linéaire Tri fusion, tri rapide
O(n²) Quadratique Tri à bulles, boucles imbriquées
O(n³) Cubique Produit de 3 matrices naïf
O(2ⁿ) Exponentielle Sous-ensembles, Fibonacci naïf
O(n!) Factorielle Voyageur de commerce (force brute)

3. Visualisation de la croissance

Pour n = 1 000 000 :

Complexité Opérations approximatives
O(1) 1
O(log n) ~20
O(n) 1 000 000
O(n log n) ~20 000 000
O(n²) 1 000 000 000 000 (10¹²) ❌
O(2ⁿ) impossible 💀

👉 O(n²) devient impraticable dès n = 100 000, alors que O(n log n) reste rapide.

4. Exemples détaillés par complexité

O(1) — Temps constant

Le temps ne dépend pas de n.

```python
def premier_element(liste):
    return liste[0]        # toujours 1 opération
```

Autres exemples : push/pop sur une pile, accès à un dictionnaire (hachage).

---

O(log n) — Logarithmique

On divise le problème par 2 à chaque étape.

```python
def recherche_dichotomique(tab, cible):
    gauche, droite = 0, len(tab) - 1
    while gauche <= droite:
        milieu = (gauche + droite) // 2
        if tab[milieu] == cible:
            return milieu
        elif tab[milieu] < cible:
            gauche = milieu + 1
        else:
            droite = milieu - 1
    return -1
```

👉 1 000 000 d'éléments → 20 comparaisons seulement.

Autres exemples : recherche dans un ABR équilibré, B-arbre, exponentiation rapide.

---

O(n) — Linéaire

On parcourt chaque élément une seule fois.

```python
def maximum(liste):
    maxi = liste[0]
    for x in liste:        # n itérations
        if x > maxi:
            maxi = x
    return maxi
```

Autres exemples : somme d'un tableau, recherche linéaire, parcours de liste chaînée.

---

O(n log n) — Quasi-linéaire

C'est la complexité des bons algorithmes de tri. Souvent : diviser (log n) × traiter chaque niveau (n).

```python
# Tri fusion : on divise log n fois, chaque fusion coûte O(n)
def tri_fusion(liste):
    if len(liste) <= 1:
        return liste
    milieu = len(liste) // 2
    gauche = tri_fusion(liste[:milieu])
    droite = tri_fusion(liste[milieu:])
    return fusion(gauche, droite)   # O(n)
```

Autres exemples : tri rapide (moyenne), tri par tas, tri fusion.

---

O(n²) — Quadratique

Typique des boucles imbriquées sur n.

```python
def tri_bulles(liste):
    n = len(liste)
    for i in range(n):           # n fois
        for j in range(n - 1):   # n fois
            if liste[j] > liste[j + 1]:
                liste[j], liste[j + 1] = liste[j + 1], liste[j]
```

👉 n = 10 000 → 100 millions d'opérations.

Autres exemples : tri par insertion/sélection (pire cas), recherche de doublons naïve, produit matriciel naïf.

---

O(2ⁿ) — Exponentielle

À chaque étape, on double le travail. Inutilisable au-delà de n ≈ 30.

```python
def fibonacci_naif(n):
    if n <= 1:
        return n
    return fibonacci_naif(n - 1) + fibonacci_naif(n - 2)
```

👉 fib(50) explose (> 10¹⁰ appels). Solution : programmation dynamique → O(n).

Autres exemples : énumération de tous les sous-ensembles, problème du sac à dos en force brute.

---

O(n!) — Factorielle

Le pire cas : toutes les permutations possibles.

```python
def permutations(elements):
    if len(elements) <= 1:
        return [elements]
    resultat = []
    for i, e in enumerate(elements):
        reste = elements[:i] + elements[i+1:]
        for p in permutations(reste):
            resultat.append([e] + p)
    return resultat
```

👉 n = 15 → plus de 10¹² combinaisons. Inutilisable.

Autres exemples : voyageur de commerce (force brute), génération de toutes les permutations.

5. Règles pour calculer un Big O

Règle Exemple
Ignorer les constantes O(3n) → O(n)
Garder le terme dominant O(n² + n) → O(n²)
Boucles séquentielles : additionner O(n) + O(n) → O(n)
Boucles imbriquées : multiplier O(n) × O(n) → O(n²)
Division par 2 : logarithme → O(log n)

Exemple complet :

```python
def exemple(liste):
    for x in liste:        # O(n)
        print(x)
    for i in liste:        # O(n²)
        for j in liste:
            print(i, j)
```

→ O(n) + O(n²) = O(n²)

6. Autres notations à connaître

Notation Signification
O(f) Borne supérieure (pire cas)
Ω(f) Borne inférieure (meilleur cas)
Θ(f) Borne exacte (les deux)
o(f) Borne supérieure stricte

Exemple sur le tri par insertion :

· Meilleur cas (liste triée) : Ω(n)
· Pire cas (liste inversée) : O(n²)
· Donc en général : O(n²)

7. Complexité en temps vs en espace

On peut analyser les deux :

```python
def tri_fusion(liste):
    # Temps : O(n log n)
    # Espace : O(n) — copies des sous-listes
```

Algorithme Temps Espace
Tri à bulles O(n²) O(1) ✅
Tri fusion O(n log n) ✅ O(n)
Tri rapide O(n log n) O(log n)
Recherche dichotomique O(log n) ✅ O(1) ✅

En résumé

· Big O = comment le temps/la mémoire évolue avec n (pire cas)
· De O(1) (excellent) à O(n!) (catastrophique)
· Objectif : rester en dessous de O(n²) pour de grandes données
· Optimisations classiques :
  · Remplacer O(n²) par O(n log n) → meilleur tri
  · Remplacer O(2ⁿ) par O(n) → programmation dynamique
  · Remplacer O(n) par O(log n) → recherche dichotomique / arbre équilibré
  · Remplacer O(n) par O(1) → table de hachage