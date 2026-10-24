Map.centerObject(BAS)
Map.addLayer(BAS);
Map.addLayer(OCSOL);

// **Filtrage des images Sentinel-2**
var S2 = S2.filterDate('2025-01-01', '2025-08-30')
    .filterBounds(BAS)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 1))
    .select('B.*');

print(S2.size());

var S2 = S2.mean().clip(BAS);

// **Affichage RGB**
var VisS2 = {
    min: 0,
    max: 3000,
    bands: ['B4', 'B3', 'B2']
};
Map.addLayer(S2, VisS2, 'RGB');

// **Calcul du NDVI (Indice de Végétation)**
var ndvi = S2.normalizedDifference(['B8', 'B4']).rename('NDVI');
var vis_ndvi = {
    min: 0,
    max: 1,
    palette: ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', '74a901',
        '66a000', '529400', '3e8601', '207401', '056201', '004c00', '023b01',
        '012e01', '011d01', '011301']
};
Map.addLayer(ndvi, vis_ndvi, 'NDVI');

// **Calcul du NDWI (Indice d'Eau)**
var ndwi = S2.normalizedDifference(['B3','B8']).rename('NDWI')

var visparams ={
  min : 0,
  max:1,
  palette: ['white','blue']
} 

Map.addLayer(ndwi,visparams,'NDWI')

// **Calcul du MNDWI (Indice d'Eau Modifié)**
var mndwi = S2.normalizedDifference(['B3', 'B11']).rename('MNDWI')
var  vis_mndwi ={
   min: -1,
   max: 1,
   palette: ['red', 'white', 'blue'] 
}
Map.addLayer(mndwi,vis_mndwi , 'MNDWI');
// **Calcul du NBR (Indice de Brûlure)**
var nbr = S2.normalizedDifference(['B8', 'B12']).rename('NBR');
Map.addLayer(nbr, { min: -1, max: 1, palette: ['yellow', 'red', 'black'] }, 'NBR');
// **Calcul du BI (Sols Nus)**
var bi = S2.expression(
'(B11 + B4 - (B8 + B2)) / (B11 + B4 + (B8 + B2))', {
'B11': S2.select('B11'),
'B4' : S2.select('B4'),
'B8' : S2.select('B8'),
'B2' : S2.select('B2')
}).rename('BI');
Map.addLayer(bi, { min: -1, max: 1, palette: ['white', 'brown', 'black'] }, 'BI (Sols Nus)');

// **Calcul de l'IBI (Zones Urbaines)**
var ibi = S2.expression(
'((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))', {
'B11': S2.select('B11'),
'B4' : S2.select('B4'),
'B8' : S2.select('B8'),
'B2' : S2.select('B2')
}).rename('IBI');
Map.addLayer(ibi, { min : -1, max : 1, palette : ['white', 'gray', 'black'] }, 'IBI (Bâti)');

// **Calcul du SI (Indice de Salinité - Espaces salés)**
var si = S2.expression(
'(B11 - B12) / (B11 + B12)', {
'B11': S2.select('B11'),
'B12' : S2.select('B12')
}).rename('SI');
Map.addLayer(si, { min : -1, max : 1, palette : ['white', 'yellow', 'red'] }, 'SI (Salinité)');


// **Calcul du MSAVI (Indice de végétation ajusté au sol modifié - Agriculture)**
var msavi = S2.expression(
'(2 * B8 + 1 - sqrt((2 * B8 + 1) ** 2 - 8 * (B8 - B4))) / 2', {
'B8' : S2.select('B8'),
'B4' : S2.select('B4')
}).rename('MSAVI');
Map.addLayer(msavi, { min: -1, max: 1, palette: ['white', 'lightgreen', 'green', 'darkgreen'] }, 'MSAVI (Agriculture)');

// **Ajout des nouvelles bandes à la composite finale**
var Composite = S2.addBands(ndvi)
.addBands(ndwi)
.addBands(mndwi)
.addBands(nbr)
.addBands(bi)
.addBands(ibi)
.addBands(si)

.addBands(msavi);

//imprimer("Composite", Composite);
//Map.addLayer(OCSOL)

//FUSIONNER LES CLASSES
var gcps= eau.merge(mangrove).merge(solnu).merge(culture).merge(vegetation)
print(gcps)

//70% pour l'entraînement et 30% pour la validation*********************************
//Ajouter la colonne aléatoire
var gcps=gcps.randomColumn()
print ('gcps',gcps)
var tarainingGcp = gcps.filter(ee.Filter.lt('random',0.7))
var validationGcp = gcps.filter(ee.Filter.gte('random',0.7))

print('tarainingGcp',tarainingGcp)
print('validationGcp',validationGcp)


//Importer les valeurs des bandes de chaque pixel

var training = Composite.sampleRegions({
  collection: tarainingGcp,
  properties:['landcover'],
  scale: 10,  
  tileScale:16
})
print ('training',training)

//Entrainer le modèle
var classifier = ee.Classifier.smileRandomForest(150).train({
  features:training ,
  classProperty: 'landcover',
  inputProperties: Composite.bandNames()
})

//Classifier l'image
var classified= Composite.classify(classifier)
Map.addLayer(classified,visClassified,'2025')

// Evaluation de précision 
// utiliser classifierd pour avoir la précision 

var validation  = classified.sampleRegions({
  collection: validationGcp,
  properties:['landcover'],
  scale: 10,  
  tileScale:16
})

print('validation',validation)


var cofusionMatrix = validation.errorMatrix('landcover','classification')
print('cofusionMatrix',cofusionMatrix)


print('validation accuracy ',cofusionMatrix.accuracy())

  //Deuxieme date 2016
 
var S2016 = ee.ImageCollection("COPERNICUS/S2_HARMONIZED")
    .filterDate('2016-01-01', '2016-12-30')
    .filterBounds(BAS)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 1))
    .select('B.*');

print(S2016.size());

var S2016 = S2016.mean().clip(BAS);
var ndvi = S2016.normalizedDifference(['B8', 'B4']).rename('NDVI');
var ndwi = S2016.normalizedDifference(['B3', 'B8']).rename('NDWI');
var mndwi = S2016.normalizedDifference(['B3', 'B11']).rename('MNDWI');
var nbr = S2016.normalizedDifference(['B8', 'B12']).rename('NBR');
var bi = S2016.expression(
    '(B11 + B4 - (B8 + B2)) / (B11 + B4 + (B8 + B2))', {
    'B11': S2.select('B11'),
    'B4': S2.select('B4'),
    'B8': S2.select('B8'),
    'B2': S2.select('B2')
}).rename('BI');
var ibi = S2016.expression(
    '((B11 + B4) - (B8 + B2)) / ((B11 + B4) + (B8 + B2))', {
    'B11': S2.select('B11'),
    'B4': S2.select('B4'),
    'B8': S2.select('B8'),
    'B2': S2.select('B2')
}).rename('IBI');
var si = S2016.expression(
    '(B11 - B12) / (B11 + B12)', {
    'B11': S2.select('B11'),
    'B12': S2.select('B12')
}).rename('SI');
var msavi = S2016.expression(
    '(2 * B8 + 1 - sqrt((2 * B8 + 1) ** 2 - 8 * (B8 - B4))) / 2', {
    'B8': S2.select('B8'),
    'B4': S2.select('B4')
}).rename('MSAVI');
var Composite2= S2016.addBands(ndvi).addBands(ndwi).addBands(mndwi).addBands(nbr)
                .addBands(bi).addBands(ibi).addBands(si).addBands(msavi)

//Classifier l'image
 var classified2= Composite2.classify(classifier)
 Map.addLayer(classified2, visClassified,'2016')
 
 Export.image.toDrive({
  image: classified2,
  description: 'LULC_2016',
  folder: 'LULC',
  region: BAS,
  scale: 10,
  fileFormat: 'GeoTIFF',
  crs:'EPSG:32628',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: classified,
  description: 'LULC_2025',
  folder: 'LULC',
  region: BAS,
  scale: 10,
  fileFormat: 'GeoTIFF',
  crs:'EPSG:32628',
  maxPixels: 1e13
});
