// 🧪 Test après corrections - FathNell
console.log('🔧 Test des corrections Pool MySQL...');

// Test de la nouvelle connexion
try {
    const { connecter } = require('./bd/connect');
    
    console.log('✅ Module connect.js chargé');
    
    connecter((error, pool) => {
        if (error) {
            console.error('❌ Erreur de connexion:', error.message);
            console.log('💡 Vérifiez que MySQL est démarré et que la base "fatnelle" existe');
        } else {
            console.log('✅ Pool MySQL fonctionne correctement');
            
            // Test d'une requête simple
            pool.query('SELECT 1 as test', (err, results) => {
                if (err) {
                    console.error('❌ Erreur requête test:', err.message);
                } else {
                    console.log('✅ Requête test réussie:', results[0]);
                    console.log('🎉 La connexion MySQL est opérationnelle !');
                    
                    // Tester si la table collections existe
                    pool.query('SHOW TABLES LIKE "collections"', (err, tables) => {
                        if (err) {
                            console.error('❌ Erreur vérification table:', err.message);
                        } else {
                            if (tables.length > 0) {
                                console.log('✅ Table collections existe');
                                console.log('🚀 Votre backend devrait maintenant fonctionner !');
                            } else {
                                console.log('⚠️  Table collections non trouvée');
                                console.log('💡 Exécutez d\'abord votre script database.sql');
                            }
                        }
                    });
                }
            });
        }
    });
    
} catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
}

console.log('\n📋 Corrections appliquées:');
console.log('✅ connect.js - Pool de connexions corrigé');
console.log('✅ config.env - Variables adaptées');
console.log('✅ controller/collection.js - Utilisation correcte du pool');
console.log('\n🚀 Redémarrez maintenant votre serveur avec: node index.js');
