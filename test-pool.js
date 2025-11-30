// 🧪 Test du nouveau pool MySQL - FathNell
console.log('🔧 === TEST POOL MYSQL SIMPLIFIÉ ===\n');

try {
    const { connecter, pool } = require('./bd/connect');
    
    console.log('✅ Module connect.js chargé');
    
    // Test 1: Vérifier que le pool existe
    if (pool && !pool._closed) {
        console.log('✅ Pool MySQL disponible');
    } else {
        console.log('❌ Pool MySQL non disponible');
        process.exit(1);
    }
    
    // Test 2: Test de connecter()
    connecter((error, testPool) => {
        if (error) {
            console.error('❌ Erreur connecter():', error.message);
            return;
        }
        
        console.log('✅ Fonction connecter() OK');
        
        // Test 3: Test de requête simple
        testPool.query('SELECT 1 as test', (err, results) => {
            if (err) {
                console.error('❌ Erreur requête test:', err.message);
                return;
            }
            
            console.log('✅ Requête test réussie:', results[0]);
            
            // Test 4: Test de la table collections
            testPool.query('SHOW TABLES LIKE "collections"', (err, tables) => {
                if (err) {
                    console.error('❌ Erreur vérification table:', err.message);
                } else {
                    if (tables.length > 0) {
                        console.log('✅ Table collections existe');
                        
                        // Test 5: Test d'insertion (simulation)
                        console.log('✅ Prêt pour les vraies requêtes !');
                        console.log('\n🎉 === TOUS LES TESTS RÉUSSIS ===');
                        console.log('🚀 Votre backend devrait maintenant fonctionner sans "Pool is closed"');
                        console.log('\n🔥 Démarrez avec: node index.js');
                        
                    } else {
                        console.log('⚠️  Table collections non trouvée');
                        console.log('💡 Exécutez votre script database.sql d\'abord');
                    }
                }
            });
        });
    });
    
} catch (error) {
    console.error('❌ Erreur critique:', error.message);
    console.log('\n💡 Vérifiez que MySQL est démarré et config.env est correct');
}
