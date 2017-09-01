const termops = require('../lib/util/termops');
const token = require('../lib/util/token');
const test = require('tape');

test('termops.getIndexableText', (t) => {
    let replacer;
    let doc;
    let texts;

    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'Main Street' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'creates indexableText');

    replacer = token.createReplacer({'Street':'St'});
    doc = { properties: { 'carmen:text': 'Main Street' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'creates contracted phrases using geocoder_tokens');

    replacer = token.createReplacer({'Street':'St'});
    doc = { properties: { 'carmen:text': 'Main Street, main st' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'include variants');

    replacer = token.createReplacer({'Street':'St', 'Lane':'Ln'}, {includeUnambiguous: true});

    doc = { properties: { 'carmen:text': 'Main Street Lane' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'lane' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'lane' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'include variants 2');

    doc = { properties: { 'carmen:text': 'Main Street Lane Ln' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'ln', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'ln', 'lane' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'lane', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'lane', 'lane' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'ln', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'ln', 'lane' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'lane', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'lane', 'lane' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'include variants 3');

    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'ln', 'ln' ], variants: [
            [ 'main', 'st', 'ln', 'lane' ],
            [ 'main', 'st', 'lane', 'ln' ],
            [ 'main', 'st', 'lane', 'lane' ],
            [ 'main', 'street', 'ln', 'ln' ],
            [ 'main', 'street', 'ln', 'lane' ],
            [ 'main', 'street', 'lane', 'ln' ],
            [ 'main', 'street', 'lane', 'lane' ]
        ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc, true), texts, 'include variants 3 with marked variants');

    doc = { properties: { 'carmen:text': 'Main Street St Lane Ln' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'st', 'ln', 'ln' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'exclude variants -- too many permutations');

    replacer = token.createReplacer({'Saint': 'St', 'Street':'St', 'Lane':'Ln'}, {includeUnambiguous: true});

    doc = { properties: { 'carmen:text': 'Main Street St Lane' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'st', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st', 'st', 'lane' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'st', 'ln' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street', 'st', 'lane' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'don\'t expand st if it\'s ambiguous');

    replacer = token.createReplacer({'Saint': 'St', 'Street':'St', 'Lane':'Ln'}, {
        includeUnambiguous: true,
        custom: {
            'St': function() {
                var full = arguments[arguments.length - 1];
                var offset = arguments[arguments.length - 2];
                var match = arguments[0];
                var pre = full.slice(0, offset);
                var post = full.slice(offset + match.length);

                var out;
                if (pre.trim() == "") out = arguments[1] + "saint" + arguments[2];
                else if (post.trim() == "") out = arguments[1] + "street" + arguments[2];
                else out = arguments[0];

                return out;
            }
        }
    });

    doc = { properties: { 'carmen:text': 'st thomas st' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'st', 'thomas', 'st' ] },
        { languages: [ 'default' ], tokens: [ 'st', 'thomas', 'street' ] },
        { languages: [ 'default' ], tokens: [ 'saint', 'thomas', 'st' ] },
        { languages: [ 'default' ], tokens: [ 'saint', 'thomas', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'include st if there\'s a custom reverse function');

    replacer = token.createReplacer({'dix-huitième':'18e'});
    doc = { properties: { 'carmen:text': 'Avenue du dix-huitième régiment' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'avenue', 'du', '18e', 'régiment' ] },
        { languages: [ 'default' ], tokens: [ 'avenue', 'du', 'dix', 'huitième', 'régiment' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'hypenated replacement');

    replacer = token.createReplacer({});
    doc = {
        properties: {
            'carmen:text':'Main Street',
            'carmen:addressnumber': [[1, 10, 100, 200]]
        }
    };
    texts = [
        { languages: [ 'default' ], tokens: ['2##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: ['1##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: ['##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: ['#', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: ['main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [],  doc), texts, 'with range');

    replacer = token.createReplacer({'street': 'st'});
    doc = {
        properties: {
            'carmen:text':'Main Street',
            'carmen:addressnumber': [[1, 10, 100, 200]]
        }
    };
    texts = [
        { languages: [ 'default' ], tokens: [ '2##', 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ '1##', 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ '##', 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ '#', 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st' ] },
        { languages: [ 'default' ], tokens: [ '2##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: [ '1##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: [ '##', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: [ '#', 'main', 'street' ] },
        { languages: [ 'default' ], tokens: [ 'main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [],  doc), texts, 'with range');

    replacer = token.createReplacer({'street': 'st'});
    doc = {
        properties: {
            'carmen:text':'Main Street',
            'carmen:addressnumber': [[1, 10, 100, 200]]
        }
    };
    texts = [
        { languages: [ 'default' ], tokens: [ '2##', 'main', 'st' ], variants: [ [ '2##', 'main', 'street' ] ] },
        { languages: [ 'default' ], tokens: [ '1##', 'main', 'st' ], variants: [ [ '1##', 'main', 'street' ] ] },
        { languages: [ 'default' ], tokens: [ '##', 'main', 'st' ], variants: [ [ '##', 'main', 'street' ] ] },
        { languages: [ 'default' ], tokens: [ '#', 'main', 'st' ], variants: [ [ '#', 'main', 'street' ] ] },
        { languages: [ 'default' ], tokens: [ 'main', 'st' ], variants: [ [ 'main', 'street' ] ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [],  doc, true), texts, 'with range and marked variants');

    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'Main Street', 'carmen:text_es': 'El Main Street' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'main', 'street' ] },
        { languages: [ 'es' ], tokens: [ 'el', 'main', 'street' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc, true), texts, 'in the presence of translations, plain carmen:text has language "default" and translations are language-specific');

    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'San Francisco Airport', 'carmen:text_universal': 'SFO' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'san', 'francisco', 'airport' ] },
        { languages: [ 'all' ], tokens: [ 'sfo' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'in the presence of universal text, plain carmen:text and text_universal both have language "all"');

    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'San Francisco Airport', 'carmen:text_universal': 'SFO', 'carmen:text_es': 'Aeropuerto de San Francisco' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'san', 'francisco', 'airport' ] },
        { languages: [ 'all' ], tokens: [ 'sfo' ] },
        { languages: [ 'es' ], tokens: [ 'aeropuerto', 'de', 'san', 'francisco' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc, true), texts, 'universal text is always indexed across langauges');
    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'Latveria,Republic of Latveria' } };
    texts = [
        { languages: [ 'default' ], tokens: [ 'latveria' ] },
        { languages: [ 'default' ], tokens: [ 'republic', 'of', 'latveria' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc), texts, 'creates indexableText w/ synonyms');

    replacer = token.createReplacer({});
    doc = { properties: { 'carmen:text': 'New York', 'carmen:text_es': 'Nueva York', 'carmen:text_en': 'New York' } };
    texts = [
        { languages: [ 'default', 'en' ], tokens: [ 'new', 'york' ] },
        { languages: [ 'es' ], tokens: [ 'nueva', 'york' ] }
    ];
    t.deepEqual(termops.getIndexableText(replacer, [], doc, true), texts, 'translations with phrase overlaps are properly grouped');

    t.end();
});

