# Cartographie de l'occupation du sol (LULC) avec Sentinel-2 – Google Earth Engine

Classification supervisée de l'occupation du sol sur la zone d'étude **BAS** (la mangrove de la casamance) à partir d'images **Sentinel-2**, avec l'algorithme **Random Forest**. Le script produit deux cartes (**2016** et **2025**) pour permettre l'analyse de l'évolution des classes d'occupation du sol.

## Accès au script

[Ouvrir dans le Code Editor Google Earth Engine](https://code.earthengine.google.com/15117b28a02e178b54de3ccbeeb7fc84)

> Un compte Google Earth Engine actif est nécessaire.

## Objectifs

- Calculer des indices spectraux à partir de Sentinel-2.
- Classifier l'occupation du sol en 5 classes à l'aide d'un modèle Random Forest.
- Évaluer la précision de la classification (matrice de confusion et précision globale).
- Appliquer le modèle entraîné sur 2025 à une image de 2016 pour comparer les deux dates.
- Exporter les cartes en GeoTIFF vers Google Drive.

## Données utilisées

| Donnée | Description |
|---|---|
| Sentinel-2 (`COPERNICUS/S2_HARMONIZED`) | Images multispectrales, bandes `B.*`, résolution 10 m (rééchantillonnage à 10 m à l'export) |
| `BAS` | Géométrie / asset de la zone d'étude |
| `OCSOL` | Couche d'occupation du sol de référence (CSE, 2020) |
| `eau`, `mangrove`, `solnu`, `culture`, `vegetation` | Points d'entraînement (GCPs) avec la propriété `landcover` |
| `visClassified` | Paramètres de visualisation de la classification |

Ces variables sont des **imports** du Code Editor : elles doivent être présentes dans le script ou partagées avec votre compte.

## Périodes d'étude

| Date | Période | Collection | Composite |
|---|---|---|---|
| 2025 | 01/01/2025 – 30/08/2025 | `COPERNICUS/S2_HARMONIZED` | Moyenne |
| 2016 | 01/01/2016 – 30/12/2016 | `COPERNICUS/S2_HARMONIZED` | Moyenne |

Filtre appliqué : `CLOUDY_PIXEL_PERCENTAGE < 1 %`.

## Indices spectraux calculés

| Indice | Formule | Usage |
|---|---|---|
| NDVI | (B8 − B4) / (B8 + B4) | Végétation |
| NDWI | (B3 − B8) / (B3 + B8) | Eau |
| MNDWI | (B3 − B11) / (B3 + B11) | Eau (modifié) |
| NBR | (B8 − B12) / (B8 + B12) | Zones brûlées |
| BI | (B11 + B4 − (B8 + B2)) / (B11 + B4 + (B8 + B2)) | Sols nus |
| IBI | ((B11 + B4) − (B8 + B2)) / ((B11 + B4) + (B8 + B2)) | Zones bâties |
| SI | (B11 − B12) / (B11 + B12) | Salinité |
| MSAVI | (2·B8 + 1 − √((2·B8 + 1)² − 8·(B8 − B4))) / 2 | Agriculture |

Ces indices sont ajoutés aux bandes Sentinel-2 pour former l'image composite utilisée par le classifieur.

## Méthodologie

1. **Prétraitement** : filtrage par date, zone et couverture nuageuse, composite et découpage sur `BAS`.
2. **Visualisation** : RGB (B4, B3, B2) et couches d'indices.
3. **Composite final** : bandes Sentinel-2 + 8 indices.
4. **Échantillons** : fusion des classes (`eau`, `mangrove`, `solnu`, `culture`, `vegetation`), puis séparation aléatoire **70 % entraînement / 30 % validation**.
5. **Entraînement** : `ee.Classifier.smileRandomForest(150)` (150 arbres) sur la propriété `landcover`.
6. **Classification** : application du modèle à l'image 2025, puis à l'image 2016.
7. **Validation** : matrice de confusion et précision globale sur les points de validation.
8. **Export** : cartes LULC 2016 et 2025 en GeoTIFF.

## Classes d'occupation du sol

- Eau
- Mangrove
- Sol nu
- Culture
- Végétation

## Sorties

| Fichier | Dossier Drive | Résolution | Projection |
|---|---|---|---|
| `LULC_2016.tif` | `LULC` | 10 m | EPSG:32628 (UTM 28N) |
| `LULC_2025.tif` | `LULC` | 10 m | EPSG:32628 (UTM 28N) |

Les exports se lancent depuis l'onglet **Tasks** du Code Editor.

## Utilisation

1. Ouvrir le script via le lien ci-dessus.
2. Vérifier que les imports (`BAS`, `S2`, `OCSOL`, points d'entraînement, `visClassified`) sont bien présents.
3. Ajuster si besoin les dates, le seuil de nuages et le nombre d'arbres.
4. Cliquer sur **Run**.
5. Consulter la console (nombre d'images, matrice de confusion, précision).
6. Lancer les exports dans l'onglet **Tasks**.


## Technologies

- Google Earth Engine (JavaScript API)
- Sentinel-2 (Copernicus)
- Random Forest (`smileRandomForest`)

## Auteur

*Oumar CAMARA, camou.oumar@gmail.com*

