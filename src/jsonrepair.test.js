"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const jsonrepair_js_1 = require("./jsonrepair.js");
const JSONRepairError_js_1 = require("./JSONRepairError.js");
describe('jsonRepair', () => {
    describe('parse valid JSON', () => {
        it('parse full JSON object', function () {
            const text = '{"a":2.3e100,"b":"str","c":null,"d":false,"e":[1,2,3]}';
            const parsed = jsonrepair_js_1.jsonrepair(text);
            assert_1.deepStrictEqual(parsed, text, 'should parse a JSON object correctly');
        });
        it('parse whitespace', function () {
            assertRepair('  { \n } \t ');
        });
        it('parse object', function () {
            assertRepair('{}');
            assertRepair('{"a": {}}');
            assertRepair('{"a": "b"}');
            assertRepair('{"a": 2}');
        });
        it('parse array', function () {
            assertRepair('[]');
            assertRepair('[{}]');
            assertRepair('{"a":[]}');
            assertRepair('[1, "hi", true, false, null, {}, []]');
        });
        it('parse number', function () {
            assertRepair('23');
            assertRepair('0');
            assertRepair('0e+2');
            assertRepair('0.0');
            assertRepair('-0');
            assertRepair('2.3');
            assertRepair('2300e3');
            assertRepair('2300e+3');
            assertRepair('2300e-3');
            assertRepair('-2');
            assertRepair('2e-3');
            assertRepair('2.3e-3');
        });
        it('parse string', function () {
            assertRepair('"str"');
            assertRepair('"\\"\\\\\\/\\b\\f\\n\\r\\t"');
            assertRepair('"\\u260E"');
        });
        it('parse keywords', function () {
            assertRepair('true');
            assertRepair('false');
            assertRepair('null');
        });
        it('correctly handle strings equaling a JSON delimiter', function () {
            assertRepair('""');
            assertRepair('"["');
            assertRepair('"]"');
            assertRepair('"{"');
            assertRepair('"}"');
            assertRepair('":"');
            assertRepair('","');
        });
        it('supports unicode characters in a string', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"★"'), '"★"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"\u2605"'), '"\u2605"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"😀"'), '"😀"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"\ud83d\ude00"'), '"\ud83d\ude00"');
        });
        it('supports unicode characters in a key', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"★":true}'), '{"★":true}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"\u2605":true}'), '{"\u2605":true}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"😀":true}'), '{"😀":true}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"\ud83d\ude00":true}'), '{"\ud83d\ude00":true}');
        });
    });
    describe('repair invalid JSON', () => {
        it('should add missing quotes', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('abc'), '"abc"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('hello   world'), '"hello   world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{a:2}'), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{a: 2}'), '{"a": 2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{2: 2}'), '{"2": 2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{true: 2}'), '{"true": 2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n  a: 2\n}'), '{\n  "a": 2\n}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[a,b]'), '["a","b"]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[\na,\nb\n]'), '[\n"a",\n"b"\n]');
        });
        it('should add missing end quote', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"abc'), '"abc"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("'abc"), '"abc"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\u2018abc'), '"abc"');
        });
        it('should replace single quotes with double quotes', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{'a':2}"), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{'a':'foo'}"), '{"a":"foo"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":\'foo\'}'), '{"a":"foo"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{a:'foo',b:'bar'}"), '{"a":"foo","b":"bar"}');
        });
        it('should replace special quotes with double quotes', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{“a”:“b”}'), '{"a":"b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{‘a’:‘b’}'), '{"a":"b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{`a´:`b´}'), '{"a":"b"}');
        });
        it('should leave string content untouched', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"{a:b}"'), '"{a:b}"');
        });
        it('should add/remove escape characters', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"foo\'bar"'), '"foo\'bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"foo\\"bar"'), '"foo\\"bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("'foo\"bar'"), '"foo\\"bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("'foo\\'bar'"), '"foo\'bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"foo\\\'bar"'), '"foo\'bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"\\a"'), '"a"');
        });
        it('should escape unescaped control characters', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello\bworld"'), '"hello\\bworld"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello\fworld"'), '"hello\\fworld"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello\nworld"'), '"hello\\nworld"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello\rworld"'), '"hello\\rworld"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello\tworld"'), '"hello\\tworld"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"value\n": "dc=hcm,dc=com"}'), '{"value\\n": "dc=hcm,dc=com"}');
        });
        it('should replace special white space characters', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":\u00a0"foo\u00a0bar"}'), '{"a": "foo\u00a0bar"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":\u202F"foo"}'), '{"a": "foo"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":\u205F"foo"}'), '{"a": "foo"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":\u3000"foo"}'), '{"a": "foo"}');
        });
        it('should replace non normalized left/right quotes', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\u2018foo\u2019'), '"foo"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\u201Cfoo\u201D'), '"foo"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\u0060foo\u00B4'), '"foo"');
            // mix single quotes
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("\u0060foo'"), '"foo"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("\u0060foo'"), '"foo"');
        });
        it('should remove block comments', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('/* foo */ {}'), ' {}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{} /* foo */ '), '{}  ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{} /* foo '), '{} ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\n/* foo */\n{}'), '\n\n{}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":"foo",/*hello*/"b":"bar"}'), '{"a":"foo","b":"bar"}');
        });
        it('should remove line comments', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{} // comment'), '{} ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n"a":"foo",//hello\n"b":"bar"\n}'), '{\n"a":"foo",\n"b":"bar"\n}');
        });
        it('should not remove comments inside a string', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"/* foo */"'), '"/* foo */"');
        });
        it('should strip JSONP notation', () => {
            // matching
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123({});'), '{}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123([]);'), '[]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123(2);'), '2');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123("foo");'), '"foo"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123(null);'), 'null');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123(true);'), 'true');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback_123(false);'), 'false');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('callback({}'), '{}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('/* foo bar */ callback_123 ({})'), ' {}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('/* foo bar */ callback_123 ({})'), ' {}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('/* foo bar */\ncallback_123({})'), '\n{}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('/* foo bar */ callback_123 (  {}  )'), '   {}  ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('  /* foo bar */   callback_123({});  '), '     {}  ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\n/* foo\nbar */\ncallback_123 ({});\n\n'), '\n\n{}\n\n');
            // non-matching
            assert_1.throws(() => console.log({ output: jsonrepair_js_1.jsonrepair('callback {}') }), new JSONRepairError_js_1.JSONRepairError('Unexpected character "{"', 9));
        });
        it('should repair escaped string contents', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\\"hello world\\"'), '"hello world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\\"hello world\\'), '"hello world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\\"hello \\\\"world\\\\"\\"'), '"hello \\"world\\""');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[\\"hello \\\\"world\\\\"\\"]'), '["hello \\"world\\""]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\\"stringified\\": \\"hello \\\\"world\\\\"\\"}'), '{"stringified": "hello \\"world\\""}');
            // the following is weird but understandable
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[\\"hello\\, \\"world\\"]'), '["hello, ","world\\\\","]"]');
            // the following is sort of invalid: the end quote should be escaped too,
            // but the fixed result is most likely what you want in the end
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('\\"hello"'), '"hello"');
        });
        it('should strip trailing commas from an array', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3,]'), '[1,2,3]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3,\n]'), '[1,2,3\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3,  \n  ]'), '[1,2,3  \n  ]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3,/*foo*/]'), '[1,2,3]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array":[1,2,3,]}'), '{"array":[1,2,3]}');
            // not matching: inside a string
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"[1,2,3,]"'), '"[1,2,3,]"');
        });
        it('should strip trailing commas from an object', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2,}'), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2  ,  }'), '{"a":2    }');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2  , \n }'), '{"a":2   \n }');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2/*foo*/,/*foo*/}'), '{"a":2}');
            // not matching: inside a string
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"{a:2,}"'), '"{a:2,}"');
        });
        it('should strip trailing comma at the end', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('4,'), '4');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('4 ,'), '4 ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('4 , '), '4  ');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2},'), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3],'), '[1,2,3]');
        });
        it('should add a missing closing bracket for an object', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{'), '{}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2'), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2,'), '{"a":2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":{"b":2}'), '{"a":{"b":2}}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n  "a":{"b":2\n}'), '{\n  "a":{"b":2\n}}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[{"b":2]'), '[{"b":2}]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[{"b":2\n]'), '[{"b":2}\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[{"i":1{"i":2}]'), '[{"i":1},{"i":2}]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[{"i":1,{"i":2}]'), '[{"i":1},{"i":2}]');
        });
        it('should add a missing closing bracket for an array', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('['), '[]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3'), '[1,2,3]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,2,3,'), '[1,2,3]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[[1,2,3,'), '[[1,2,3]]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n"values":[1,2,3\n}'), '{\n"values":[1,2,3]\n}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n"values":[1,2,3\n'), '{\n"values":[1,2,3]}\n');
        });
        it('should strip MongoDB data types', () => {
            // simple
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('NumberLong("2")'), '"2"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"_id":ObjectId("123")}'), '{"_id":"123"}');
            // extensive
            const mongoDocument = '{\n' +
                '   "_id" : ObjectId("123"),\n' +
                '   "isoDate" : ISODate("2012-12-19T06:01:17.171Z"),\n' +
                '   "regularNumber" : 67,\n' +
                '   "long" : NumberLong("2"),\n' +
                '   "long2" : NumberLong(2),\n' +
                '   "int" : NumberInt("3"),\n' +
                '   "int2" : NumberInt(3),\n' +
                '   "decimal" : NumberDecimal("4"),\n' +
                '   "decimal2" : NumberDecimal(4)\n' +
                '}';
            const expectedJson = '{\n' +
                '   "_id" : "123",\n' +
                '   "isoDate" : "2012-12-19T06:01:17.171Z",\n' +
                '   "regularNumber" : 67,\n' +
                '   "long" : "2",\n' +
                '   "long2" : 2,\n' +
                '   "int" : "3",\n' +
                '   "int2" : 3,\n' +
                '   "decimal" : "4",\n' +
                '   "decimal2" : 4\n' +
                '}';
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair(mongoDocument), expectedJson);
        });
        it('should replace Python constants None, True, False', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('True'), 'true');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('False'), 'false');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('None'), 'null');
        });
        it('should turn unknown symbols into a string', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('foo'), '"foo"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[1,foo,4]'), '[1,"foo",4]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{foo: bar}'), '{"foo": "bar"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('foo 2 bar'), '"foo 2 bar"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{greeting: hello world}'), '{"greeting": "hello world"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{greeting: hello world\nnext: "line"}'), '{"greeting": "hello world",\n"next": "line"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{greeting: hello world!}'), '{"greeting": "hello world!"}');
        });
        it('should concatenate strings', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello" + " world"'), '"hello world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello" +\n " world"'), '"hello world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"a"+"b"+"c"'), '"abc"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('"hello" + /*comment*/ " world"'), '"hello world"');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{\n  \"greeting\": 'hello' +\n 'world'\n}"), '{\n  "greeting": "helloworld"\n}');
        });
        it('should repair missing comma between array items', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [{}{}]}'), '{"array": [{},{}]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [{} {}]}'), '{"array": [{}, {}]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [{}\n{}]}'), '{"array": [{},\n{}]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [\n{}\n{}\n]}'), '{"array": [\n{},\n{}\n]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [\n1\n2\n]}'), '{"array": [\n1,\n2\n]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [\n"a"\n"b"\n]}'), '{"array": [\n"a",\n"b"\n]}');
            // should leave normal array as is
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[\n{},\n{}\n]'), '[\n{},\n{}\n]');
        });
        it('should repair missing comma between object properties', () => {
            // strictEqual(jsonrepair('{"a":2\n"b":3\n}'), '{"a":2,\n"b":3\n}')
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a":2\n"b":3\nc:4}'), '{"a":2,\n"b":3,\n"c":4}');
        });
        it('should repair missing colon between object key and value', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a" "b"}'), '{"a": "b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a" 2}'), '{"a": 2}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{\n"a" "b"\n}'), '{\n"a": "b"\n}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"a" \'b\'}'), '{"a": "b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{'a' 'b'}"), '{"a": "b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{“a” “b”}'), '{"a": "b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair("{a 'b'}"), '{"a": "b"}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{a “b”}'), '{"a": "b"}');
        });
        it('should repair missing a combination of comma, quotes and brackets', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('{"array": [\na\nb\n]}'), '{"array": [\n"a",\n"b"\n]}');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('1\n2'), '[\n1,\n2\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('[a,b\nc]'), '["a","b",\n"c"]');
        });
        it('should repair newline separated json (for example from MongoDB)', () => {
            const text = '' + '/* 1 */\n' + '{}\n' + '\n' + '/* 2 */\n' + '{}\n' + '\n' + '/* 3 */\n' + '{}\n';
            const expected = '[\n\n{},\n\n\n{},\n\n\n{}\n\n]';
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair(text), expected);
        });
        it('should repair newline separated json having commas', () => {
            const text = '' + '/* 1 */\n' + '{},\n' + '\n' + '/* 2 */\n' + '{},\n' + '\n' + '/* 3 */\n' + '{}\n';
            const expected = '[\n\n{},\n\n\n{},\n\n\n{}\n\n]';
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair(text), expected);
        });
        it('should repair newline separated json having commas and trailing comma', () => {
            const text = '' + '/* 1 */\n' + '{},\n' + '\n' + '/* 2 */\n' + '{},\n' + '\n' + '/* 3 */\n' + '{},\n';
            const expected = '[\n\n{},\n\n\n{},\n\n\n{}\n\n]';
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair(text), expected);
        });
        it('should repair a comma separated list with value', () => {
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('1,2,3'), '[\n1,2,3\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('1,2,3,'), '[\n1,2,3\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('1\n2\n3'), '[\n1,\n2,\n3\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('a\nb'), '[\n"a",\n"b"\n]');
            assert_1.strictEqual(jsonrepair_js_1.jsonrepair('a,b'), '[\n"a","b"\n]');
        });
    });
    it('should throw an exception in case of non-repairable issues', function () {
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected end of json string', 0));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('{"a",') });
        }, new JSONRepairError_js_1.JSONRepairError('Colon expected', 4));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('{:2}') });
        }, new JSONRepairError_js_1.JSONRepairError('Object key expected', 1));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('{"a":2,]') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "]"', 7));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('{"a" ]') });
        }, new JSONRepairError_js_1.JSONRepairError('Colon expected', 5));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('{}}') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "}"', 2));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('[2,}') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "}"', 3));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('2.3.4') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "."', 3));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('2..3') });
        }, new JSONRepairError_js_1.JSONRepairError("Invalid number '2.', expecting a digit but got '.'", 2));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('2e3.4') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "."', 3));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('2e') });
        }, new JSONRepairError_js_1.JSONRepairError("Invalid number '2e', expecting a digit but reached end of input", 2));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('-') });
        }, new JSONRepairError_js_1.JSONRepairError("Invalid number '-', expecting a digit but reached end of input", 2));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('foo [') });
        }, new JSONRepairError_js_1.JSONRepairError('Unexpected character "["', 4));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('"\\u26"') });
        }, new JSONRepairError_js_1.JSONRepairError('Invalid unicode character "\\u26"', 1));
        assert_1.throws(function () {
            console.log({ output: jsonrepair_js_1.jsonrepair('"\\uZ000"') });
        }, new JSONRepairError_js_1.JSONRepairError('Invalid unicode character "\\uZ000"', 1));
    });
});
function assertRepair(text) {
    assert_1.strictEqual(jsonrepair_js_1.jsonrepair(text), text);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbnJlcGFpci50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsianNvbnJlcGFpci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTZEO0FBQzdELG1EQUE0QztBQUM1Qyw2REFBc0Q7QUFFdEQsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7SUFDMUIsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxFQUFFLENBQUMsd0JBQXdCLEVBQUU7WUFDM0IsTUFBTSxJQUFJLEdBQUcsd0RBQXdELENBQUE7WUFDckUsTUFBTSxNQUFNLEdBQUcsMEJBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUUvQix3QkFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsc0NBQXNDLENBQUMsQ0FBQTtRQUN2RSxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRTtZQUNyQixZQUFZLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDOUIsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsY0FBYyxFQUFFO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNsQixZQUFZLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDekIsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQzFCLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxhQUFhLEVBQUU7WUFDaEIsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ2xCLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNwQixZQUFZLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDeEIsWUFBWSxDQUFDLHNDQUFzQyxDQUFDLENBQUE7UUFDdEQsQ0FBQyxDQUFDLENBQUE7UUFFRixFQUFFLENBQUMsY0FBYyxFQUFFO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNsQixZQUFZLENB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QkFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM3QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFakQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqRCxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMvQyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFNUMsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM1QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM3QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM3QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLG9EQUFvRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFaEYsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMzQyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLGlFQUFpRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFN0YsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUMxQyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLGdFQUFnRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFNUYsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUM5QyxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFdEQsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNoRCxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLG1DQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFL0QsZUFBTSxDQUFDO1lBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSwwQkFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNsRCxDQUFDLEVBQUUsSUFBSSxvQ0FBZSxDQUFDLHFDQUFxQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUMsQ0FBQTtBQUVGLFNBQVMsWUFBWSxDQUFDLElBQVk7SUFDaEMsb0JBQVcsQ0FBQywwQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzdHJpY3RFcXVhbCwgZGVlcFN0cmljdEVxdWFsLCB0aHJvd3MgfSBmcm9tICdhc3NlcnQnXG5pbXBvcnQgeyBqc29ucmVwYWlyIH0gZnJvbSAnLi9qc29ucmVwYWlyLmpzJ1xuaW1wb3J0IHsgSlNPTlJlcGFpckVycm9yIH0gZnJvbSAnLi9KU09OUmVwYWlyRXJyb3IuanMnXG5cbmRlc2NyaWJlKCdqc29uUmVwYWlyJywgKCkgPT4ge1xuICBkZXNjcmliZSgncGFyc2UgdmFsaWQgSlNPTicsICgpID0+IHtcbiAgICBpdCgncGFyc2UgZnVsbCBKU09OIG9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHRleHQgPSAne1wiYVwiOjIuM2UxMDAsXCJiXCI6XCJzdHJcIixcImNcIjpudWxsLFwiZFwiOmZhbHNlLFwiZVwiOlsxLDIsM119J1xuICAgICAgY29uc3QgcGFyc2VkID0ganNvbnJlcGFpcih0ZXh0KVxuXG4gICAgICBkZWVwU3RyaWN0RXF1YWwocGFyc2VkLCB0ZXh0LCAnc2hvdWxkIHBhcnNlIGEgSlNPTiBvYmplY3QgY29ycmVjdGx5JylcbiAgICB9KVxuXG4gICAgaXQoJ3BhcnNlIHdoaXRlc3BhY2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBhc3NlcnRSZXBhaXIoJyAgeyBcXG4gfSBcXHQgJylcbiAgICB9KVxuXG4gICAgaXQoJ3BhcnNlIG9iamVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydFJlcGFpcigne30nKVxuICAgICAgYXNzZXJ0UmVwYWlyKCd7XCJhXCI6IHt9fScpXG4gICAgICBhc3NlcnRSZXBhaXIoJ3tcImFcIjogXCJiXCJ9JylcbiAgICAgIGFzc2VydFJlcGFpcigne1wiYVwiOiAyfScpXG4gICAgfSlcblxuICAgIGl0KCdwYXJzZSBhcnJheScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydFJlcGFpcignW10nKVxuICAgICAgYXNzZXJ0UmVwYWlyKCdbe31dJylcbiAgICAgIGFzc2VydFJlcGFpcigne1wiYVwiOltdfScpXG4gICAgICBhc3NlcnRSZXBhaXIoJ1sxLCBcImhpXCIsIHRydWUsIGZhbHNlLCBudWxsLCB7fSwgW11dJylcbiAgICB9KVxuXG4gICAgaXQoJ3BhcnNlIG51bWJlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydFJlcGFpcignMjMnKVxuICAgICAgYXNzZXJ0UmVwYWlyKCcwJylcbiAgICAgIGFzc2VydFJlcGFpcignMGUrMicpXG4gICAgICBhc3NlcnRSZXBhaXIoJzAuMCcpXG4gICAgICBhc3NlcnRSZXBhaXIoJy0wJylcbiAgICAgIGFzc2VydFJlcGFpcignMi4zJylcbiAgICAgIGFzc2VydFJlcGFpcignMjMwMGUzJylcbiAgICAgIGFzc2VydFJlcGFpcignMjMwMGUrMycpXG4gICAgICBhc3NlcnRSZXBhaXIoJzIzMDBlLTMnKVxuICAgICAgYXNzZXJ0UmVwYWlyKCctMicpXG4gICAgICBhc3NlcnRSZXBhaXIoJzJlLTMnKVxuICAgICAgYXNzZXJ0UmVwYWlyKCcyLjNlLTMnKVxuICAgIH0pXG5cbiAgICBpdCgncGFyc2Ugc3RyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgICAgYXNzZXJ0UmVwYWlyKCdcInN0clwiJylcbiAgICAgIGFzc2VydFJlcGFpcignXCJcXFxcXCJcXFxcXFxcXFxcXFwvXFxcXGJcXFxcZlxcXFxuXFxcXHJcXFxcdFwiJylcbiAgICAgIGFzc2VydFJlcGFpcignXCJcXFxcdTI2MEVcIicpXG4gICAgfSlcblxuICAgIGl0KCdwYXJzZSBrZXl3b3JkcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydFJlcGFpcigndHJ1ZScpXG4gICAgICBhc3NlcnRSZXBhaXIoJ2ZhbHNlJylcbiAgICAgIGFzc2VydFJlcGFpcignbnVsbCcpXG4gICAgfSlcblxuICAgIGl0KCdjb3JyZWN0bHkgaGFuZGxlIHN0cmluZ3MgZXF1YWxpbmcgYSBKU09OIGRlbGltaXRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydFJlcGFpcignXCJcIicpXG4gICAgICBhc3NlcnRSZXBhaXIoJ1wiW1wiJylcbiAgICAgIGFzc2VydFJlcGFpcignXCJdXCInKVxuICAgICAgYXNzZXJ0UmVwYWlyKCdcIntcIicpXG4gICAgICBhc3NlcnRSZXBhaXIoJ1wifVwiJylcbiAgICAgIGFzc2VydFJlcGFpcignXCI6XCInKVxuICAgICAgYXNzZXJ0UmVwYWlyKCdcIixcIicpXG4gICAgfSlcblxuICAgIGl0KCdzdXBwb3J0cyB1bmljb2RlIGNoYXJhY3RlcnMgaW4gYSBzdHJpbmcnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcIuKYhVwiJyksICdcIuKYhVwiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1wiXFx1MjYwNVwiJyksICdcIlxcdTI2MDVcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcIvCfmIBcIicpLCAnXCLwn5iAXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJcXHVkODNkXFx1ZGUwMFwiJyksICdcIlxcdWQ4M2RcXHVkZTAwXCInKVxuICAgIH0pXG5cbiAgICBpdCgnc3VwcG9ydHMgdW5pY29kZSBjaGFyYWN0ZXJzIGluIGEga2V5JywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wi4piFXCI6dHJ1ZX0nKSwgJ3tcIuKYhVwiOnRydWV9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcIlxcdTI2MDVcIjp0cnVlfScpLCAne1wiXFx1MjYwNVwiOnRydWV9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcIvCfmIBcIjp0cnVlfScpLCAne1wi8J+YgFwiOnRydWV9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcIlxcdWQ4M2RcXHVkZTAwXCI6dHJ1ZX0nKSwgJ3tcIlxcdWQ4M2RcXHVkZTAwXCI6dHJ1ZX0nKVxuICAgIH0pXG4gIH0pXG5cbiAgZGVzY3JpYmUoJ3JlcGFpciBpbnZhbGlkIEpTT04nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhZGQgbWlzc2luZyBxdW90ZXMnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdhYmMnKSwgJ1wiYWJjXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignaGVsbG8gICB3b3JsZCcpLCAnXCJoZWxsbyAgIHdvcmxkXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne2E6Mn0nKSwgJ3tcImFcIjoyfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7YTogMn0nKSwgJ3tcImFcIjogMn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignezI6IDJ9JyksICd7XCIyXCI6IDJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3t0cnVlOiAyfScpLCAne1widHJ1ZVwiOiAyfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XFxuICBhOiAyXFxufScpLCAne1xcbiAgXCJhXCI6IDJcXG59JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1thLGJdJyksICdbXCJhXCIsXCJiXCJdJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1tcXG5hLFxcbmJcXG5dJyksICdbXFxuXCJhXCIsXFxuXCJiXCJcXG5dJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhZGQgbWlzc2luZyBlbmQgcXVvdGUnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImFiYycpLCAnXCJhYmNcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKFwiJ2FiY1wiKSwgJ1wiYWJjXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXFx1MjAxOGFiYycpLCAnXCJhYmNcIicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwbGFjZSBzaW5nbGUgcXVvdGVzIHdpdGggZG91YmxlIHF1b3RlcycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoXCJ7J2EnOjJ9XCIpLCAne1wiYVwiOjJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoXCJ7J2EnOidmb28nfVwiKSwgJ3tcImFcIjpcImZvb1wifScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhXCI6XFwnZm9vXFwnfScpLCAne1wiYVwiOlwiZm9vXCJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoXCJ7YTonZm9vJyxiOidiYXInfVwiKSwgJ3tcImFcIjpcImZvb1wiLFwiYlwiOlwiYmFyXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXBsYWNlIHNwZWNpYWwgcXVvdGVzIHdpdGggZG91YmxlIHF1b3RlcycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3vigJxh4oCdOuKAnGLigJ19JyksICd7XCJhXCI6XCJiXCJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3vigJhh4oCZOuKAmGLigJl9JyksICd7XCJhXCI6XCJiXCJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tgYcK0OmBiwrR9JyksICd7XCJhXCI6XCJiXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBsZWF2ZSBzdHJpbmcgY29udGVudCB1bnRvdWNoZWQnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcInthOmJ9XCInKSwgJ1wie2E6Yn1cIicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYWRkL3JlbW92ZSBlc2NhcGUgY2hhcmFjdGVycycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1wiZm9vXFwnYmFyXCInKSwgJ1wiZm9vXFwnYmFyXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJmb29cXFxcXCJiYXJcIicpLCAnXCJmb29cXFxcXCJiYXJcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKFwiJ2Zvb1xcXCJiYXInXCIpLCAnXCJmb29cXFxcXCJiYXJcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKFwiJ2Zvb1xcXFwnYmFyJ1wiKSwgJ1wiZm9vXFwnYmFyXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJmb29cXFxcXFwnYmFyXCInKSwgJ1wiZm9vXFwnYmFyXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJcXFxcYVwiJyksICdcImFcIicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgZXNjYXBlIHVuZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXFxid29ybGRcIicpLCAnXCJoZWxsb1xcXFxid29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXFxmd29ybGRcIicpLCAnXCJoZWxsb1xcXFxmd29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXFxud29ybGRcIicpLCAnXCJoZWxsb1xcXFxud29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXFxyd29ybGRcIicpLCAnXCJoZWxsb1xcXFxyd29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXFx0d29ybGRcIicpLCAnXCJoZWxsb1xcXFx0d29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJ2YWx1ZVxcblwiOiBcImRjPWhjbSxkYz1jb21cIn0nKSwgJ3tcInZhbHVlXFxcXG5cIjogXCJkYz1oY20sZGM9Y29tXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXBsYWNlIHNwZWNpYWwgd2hpdGUgc3BhY2UgY2hhcmFjdGVycycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjpcXHUwMGEwXCJmb29cXHUwMGEwYmFyXCJ9JyksICd7XCJhXCI6IFwiZm9vXFx1MDBhMGJhclwifScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhXCI6XFx1MjAyRlwiZm9vXCJ9JyksICd7XCJhXCI6IFwiZm9vXCJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjpcXHUyMDVGXCJmb29cIn0nKSwgJ3tcImFcIjogXCJmb29cIn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOlxcdTMwMDBcImZvb1wifScpLCAne1wiYVwiOiBcImZvb1wifScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwbGFjZSBub24gbm9ybWFsaXplZCBsZWZ0L3JpZ2h0IHF1b3RlcycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1xcdTIwMThmb29cXHUyMDE5JyksICdcImZvb1wiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1xcdTIwMUNmb29cXHUyMDFEJyksICdcImZvb1wiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1xcdTAwNjBmb29cXHUwMEI0JyksICdcImZvb1wiJylcblxuICAgICAgLy8gbWl4IHNpbmdsZSBxdW90ZXNcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoXCJcXHUwMDYwZm9vJ1wiKSwgJ1wiZm9vXCInKVxuXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKFwiXFx1MDA2MGZvbydcIiksICdcImZvb1wiJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgYmxvY2sgY29tbWVudHMnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCcvKiBmb28gKi8ge30nKSwgJyB7fScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7fSAvKiBmb28gKi8gJyksICd7fSAgJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3t9IC8qIGZvbyAnKSwgJ3t9ICcpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcXG4vKiBmb28gKi9cXG57fScpLCAnXFxuXFxue30nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOlwiZm9vXCIsLypoZWxsbyovXCJiXCI6XCJiYXJcIn0nKSwgJ3tcImFcIjpcImZvb1wiLFwiYlwiOlwiYmFyXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgbGluZSBjb21tZW50cycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3t9IC8vIGNvbW1lbnQnKSwgJ3t9ICcpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XFxuXCJhXCI6XCJmb29cIiwvL2hlbGxvXFxuXCJiXCI6XCJiYXJcIlxcbn0nKSwgJ3tcXG5cImFcIjpcImZvb1wiLFxcblwiYlwiOlwiYmFyXCJcXG59JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBub3QgcmVtb3ZlIGNvbW1lbnRzIGluc2lkZSBhIHN0cmluZycsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1wiLyogZm9vICovXCInKSwgJ1wiLyogZm9vICovXCInKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN0cmlwIEpTT05QIG5vdGF0aW9uJywgKCkgPT4ge1xuICAgICAgLy8gbWF0Y2hpbmdcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ2NhbGxiYWNrXzEyMyh7fSk7JyksICd7fScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdjYWxsYmFja18xMjMoW10pOycpLCAnW10nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignY2FsbGJhY2tfMTIzKDIpOycpLCAnMicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdjYWxsYmFja18xMjMoXCJmb29cIik7JyksICdcImZvb1wiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ2NhbGxiYWNrXzEyMyhudWxsKTsnKSwgJ251bGwnKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignY2FsbGJhY2tfMTIzKHRydWUpOycpLCAndHJ1ZScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdjYWxsYmFja18xMjMoZmFsc2UpOycpLCAnZmFsc2UnKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignY2FsbGJhY2soe30nKSwgJ3t9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJy8qIGZvbyBiYXIgKi8gY2FsbGJhY2tfMTIzICh7fSknKSwgJyB7fScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCcvKiBmb28gYmFyICovIGNhbGxiYWNrXzEyMyAoe30pJyksICcge30nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignLyogZm9vIGJhciAqL1xcbmNhbGxiYWNrXzEyMyh7fSknKSwgJ1xcbnt9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJy8qIGZvbyBiYXIgKi8gY2FsbGJhY2tfMTIzICggIHt9ICApJyksICcgICB7fSAgJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJyAgLyogZm9vIGJhciAqLyAgIGNhbGxiYWNrXzEyMyh7fSk7ICAnKSwgJyAgICAge30gICcpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcXG4vKiBmb29cXG5iYXIgKi9cXG5jYWxsYmFja18xMjMgKHt9KTtcXG5cXG4nKSwgJ1xcblxcbnt9XFxuXFxuJylcblxuICAgICAgLy8gbm9uLW1hdGNoaW5nXG4gICAgICB0aHJvd3MoXG4gICAgICAgICgpID0+IGNvbnNvbGUubG9nKHsgb3V0cHV0OiBqc29ucmVwYWlyKCdjYWxsYmFjayB7fScpIH0pLFxuICAgICAgICBuZXcgSlNPTlJlcGFpckVycm9yKCdVbmV4cGVjdGVkIGNoYXJhY3RlciBcIntcIicsIDkpXG4gICAgICApXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwYWlyIGVzY2FwZWQgc3RyaW5nIGNvbnRlbnRzJywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXFxcXFwiaGVsbG8gd29ybGRcXFxcXCInKSwgJ1wiaGVsbG8gd29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcXFxcXCJoZWxsbyB3b3JsZFxcXFwnKSwgJ1wiaGVsbG8gd29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcXFxcXCJoZWxsbyBcXFxcXFxcXFwid29ybGRcXFxcXFxcXFwiXFxcXFwiJyksICdcImhlbGxvIFxcXFxcIndvcmxkXFxcXFwiXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignW1xcXFxcImhlbGxvIFxcXFxcXFxcXCJ3b3JsZFxcXFxcXFxcXCJcXFxcXCJdJyksICdbXCJoZWxsbyBcXFxcXCJ3b3JsZFxcXFxcIlwiXScpXG4gICAgICBzdHJpY3RFcXVhbChcbiAgICAgICAganNvbnJlcGFpcigne1xcXFxcInN0cmluZ2lmaWVkXFxcXFwiOiBcXFxcXCJoZWxsbyBcXFxcXFxcXFwid29ybGRcXFxcXFxcXFwiXFxcXFwifScpLFxuICAgICAgICAne1wic3RyaW5naWZpZWRcIjogXCJoZWxsbyBcXFxcXCJ3b3JsZFxcXFxcIlwifSdcbiAgICAgIClcblxuICAgICAgLy8gdGhlIGZvbGxvd2luZyBpcyB3ZWlyZCBidXQgdW5kZXJzdGFuZGFibGVcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1tcXFxcXCJoZWxsb1xcXFwsIFxcXFxcIndvcmxkXFxcXFwiXScpLCAnW1wiaGVsbG8sIFwiLFwid29ybGRcXFxcXFxcXFwiLFwiXVwiXScpXG5cbiAgICAgIC8vIHRoZSBmb2xsb3dpbmcgaXMgc29ydCBvZiBpbnZhbGlkOiB0aGUgZW5kIHF1b3RlIHNob3VsZCBiZSBlc2NhcGVkIHRvbyxcbiAgICAgIC8vIGJ1dCB0aGUgZml4ZWQgcmVzdWx0IGlzIG1vc3QgbGlrZWx5IHdoYXQgeW91IHdhbnQgaW4gdGhlIGVuZFxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXFxcXFwiaGVsbG9cIicpLCAnXCJoZWxsb1wiJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzdHJpcCB0cmFpbGluZyBjb21tYXMgZnJvbSBhbiBhcnJheScsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1sxLDIsMyxdJyksICdbMSwyLDNdJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1sxLDIsMyxcXG5dJyksICdbMSwyLDNcXG5dJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1sxLDIsMywgIFxcbiAgXScpLCAnWzEsMiwzICBcXG4gIF0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignWzEsMiwzLC8qZm9vKi9dJyksICdbMSwyLDNdJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFycmF5XCI6WzEsMiwzLF19JyksICd7XCJhcnJheVwiOlsxLDIsM119JylcblxuICAgICAgLy8gbm90IG1hdGNoaW5nOiBpbnNpZGUgYSBzdHJpbmdcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1wiWzEsMiwzLF1cIicpLCAnXCJbMSwyLDMsXVwiJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBzdHJpcCB0cmFpbGluZyBjb21tYXMgZnJvbSBhbiBvYmplY3QnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhXCI6Mix9JyksICd7XCJhXCI6Mn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOjIgICwgIH0nKSwgJ3tcImFcIjoyICAgIH0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOjIgICwgXFxuIH0nKSwgJ3tcImFcIjoyICAgXFxuIH0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOjIvKmZvbyovLC8qZm9vKi99JyksICd7XCJhXCI6Mn0nKVxuXG4gICAgICAvLyBub3QgbWF0Y2hpbmc6IGluc2lkZSBhIHN0cmluZ1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJ7YToyLH1cIicpLCAnXCJ7YToyLH1cIicpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgc3RyaXAgdHJhaWxpbmcgY29tbWEgYXQgdGhlIGVuZCcsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJzQsJyksICc0JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJzQgLCcpLCAnNCAnKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignNCAsICcpLCAnNCAgJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjoyfSwnKSwgJ3tcImFcIjoyfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbMSwyLDNdLCcpLCAnWzEsMiwzXScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgYWRkIGEgbWlzc2luZyBjbG9zaW5nIGJyYWNrZXQgZm9yIGFuIG9iamVjdCcsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3snKSwgJ3t9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjoyJyksICd7XCJhXCI6Mn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOjIsJyksICd7XCJhXCI6Mn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiOntcImJcIjoyfScpLCAne1wiYVwiOntcImJcIjoyfX0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1xcbiAgXCJhXCI6e1wiYlwiOjJcXG59JyksICd7XFxuICBcImFcIjp7XCJiXCI6Mlxcbn19JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1t7XCJiXCI6Ml0nKSwgJ1t7XCJiXCI6Mn1dJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1t7XCJiXCI6Mlxcbl0nKSwgJ1t7XCJiXCI6Mn1cXG5dJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1t7XCJpXCI6MXtcImlcIjoyfV0nKSwgJ1t7XCJpXCI6MX0se1wiaVwiOjJ9XScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbe1wiaVwiOjEse1wiaVwiOjJ9XScpLCAnW3tcImlcIjoxfSx7XCJpXCI6Mn1dJylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBhZGQgYSBtaXNzaW5nIGNsb3NpbmcgYnJhY2tldCBmb3IgYW4gYXJyYXknLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbJyksICdbXScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbMSwyLDMnKSwgJ1sxLDIsM10nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignWzEsMiwzLCcpLCAnWzEsMiwzXScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbWzEsMiwzLCcpLCAnW1sxLDIsM11dJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcXG5cInZhbHVlc1wiOlsxLDIsM1xcbn0nKSwgJ3tcXG5cInZhbHVlc1wiOlsxLDIsM11cXG59JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcXG5cInZhbHVlc1wiOlsxLDIsM1xcbicpLCAne1xcblwidmFsdWVzXCI6WzEsMiwzXX1cXG4nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHN0cmlwIE1vbmdvREIgZGF0YSB0eXBlcycsICgpID0+IHtcbiAgICAgIC8vIHNpbXBsZVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignTnVtYmVyTG9uZyhcIjJcIiknKSwgJ1wiMlwiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcIl9pZFwiOk9iamVjdElkKFwiMTIzXCIpfScpLCAne1wiX2lkXCI6XCIxMjNcIn0nKVxuXG4gICAgICAvLyBleHRlbnNpdmVcbiAgICAgIGNvbnN0IG1vbmdvRG9jdW1lbnQgPVxuICAgICAgICAne1xcbicgK1xuICAgICAgICAnICAgXCJfaWRcIiA6IE9iamVjdElkKFwiMTIzXCIpLFxcbicgK1xuICAgICAgICAnICAgXCJpc29EYXRlXCIgOiBJU09EYXRlKFwiMjAxMi0xMi0xOVQwNjowMToxNy4xNzFaXCIpLFxcbicgK1xuICAgICAgICAnICAgXCJyZWd1bGFyTnVtYmVyXCIgOiA2NyxcXG4nICtcbiAgICAgICAgJyAgIFwibG9uZ1wiIDogTnVtYmVyTG9uZyhcIjJcIiksXFxuJyArXG4gICAgICAgICcgICBcImxvbmcyXCIgOiBOdW1iZXJMb25nKDIpLFxcbicgK1xuICAgICAgICAnICAgXCJpbnRcIiA6IE51bWJlckludChcIjNcIiksXFxuJyArXG4gICAgICAgICcgICBcImludDJcIiA6IE51bWJlckludCgzKSxcXG4nICtcbiAgICAgICAgJyAgIFwiZGVjaW1hbFwiIDogTnVtYmVyRGVjaW1hbChcIjRcIiksXFxuJyArXG4gICAgICAgICcgICBcImRlY2ltYWwyXCIgOiBOdW1iZXJEZWNpbWFsKDQpXFxuJyArXG4gICAgICAgICd9J1xuXG4gICAgICBjb25zdCBleHBlY3RlZEpzb24gPVxuICAgICAgICAne1xcbicgK1xuICAgICAgICAnICAgXCJfaWRcIiA6IFwiMTIzXCIsXFxuJyArXG4gICAgICAgICcgICBcImlzb0RhdGVcIiA6IFwiMjAxMi0xMi0xOVQwNjowMToxNy4xNzFaXCIsXFxuJyArXG4gICAgICAgICcgICBcInJlZ3VsYXJOdW1iZXJcIiA6IDY3LFxcbicgK1xuICAgICAgICAnICAgXCJsb25nXCIgOiBcIjJcIixcXG4nICtcbiAgICAgICAgJyAgIFwibG9uZzJcIiA6IDIsXFxuJyArXG4gICAgICAgICcgICBcImludFwiIDogXCIzXCIsXFxuJyArXG4gICAgICAgICcgICBcImludDJcIiA6IDMsXFxuJyArXG4gICAgICAgICcgICBcImRlY2ltYWxcIiA6IFwiNFwiLFxcbicgK1xuICAgICAgICAnICAgXCJkZWNpbWFsMlwiIDogNFxcbicgK1xuICAgICAgICAnfSdcblxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcihtb25nb0RvY3VtZW50KSwgZXhwZWN0ZWRKc29uKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlcGxhY2UgUHl0aG9uIGNvbnN0YW50cyBOb25lLCBUcnVlLCBGYWxzZScsICgpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1RydWUnKSwgJ3RydWUnKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignRmFsc2UnKSwgJ2ZhbHNlJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ05vbmUnKSwgJ251bGwnKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHR1cm4gdW5rbm93biBzeW1ib2xzIGludG8gYSBzdHJpbmcnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdmb28nKSwgJ1wiZm9vXCInKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignWzEsZm9vLDRdJyksICdbMSxcImZvb1wiLDRdJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tmb286IGJhcn0nKSwgJ3tcImZvb1wiOiBcImJhclwifScpXG5cbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ2ZvbyAyIGJhcicpLCAnXCJmb28gMiBiYXJcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7Z3JlZXRpbmc6IGhlbGxvIHdvcmxkfScpLCAne1wiZ3JlZXRpbmdcIjogXCJoZWxsbyB3b3JsZFwifScpXG4gICAgICBzdHJpY3RFcXVhbChcbiAgICAgICAganNvbnJlcGFpcigne2dyZWV0aW5nOiBoZWxsbyB3b3JsZFxcbm5leHQ6IFwibGluZVwifScpLFxuICAgICAgICAne1wiZ3JlZXRpbmdcIjogXCJoZWxsbyB3b3JsZFwiLFxcblwibmV4dFwiOiBcImxpbmVcIn0nXG4gICAgICApXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7Z3JlZXRpbmc6IGhlbGxvIHdvcmxkIX0nKSwgJ3tcImdyZWV0aW5nXCI6IFwiaGVsbG8gd29ybGQhXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCBjb25jYXRlbmF0ZSBzdHJpbmdzJywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignXCJoZWxsb1wiICsgXCIgd29ybGRcIicpLCAnXCJoZWxsbyB3b3JsZFwiJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ1wiaGVsbG9cIiArXFxuIFwiIHdvcmxkXCInKSwgJ1wiaGVsbG8gd29ybGRcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImFcIitcImJcIitcImNcIicpLCAnXCJhYmNcIicpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdcImhlbGxvXCIgKyAvKmNvbW1lbnQqLyBcIiB3b3JsZFwiJyksICdcImhlbGxvIHdvcmxkXCInKVxuICAgICAgc3RyaWN0RXF1YWwoXG4gICAgICAgIGpzb25yZXBhaXIoXCJ7XFxuICBcXFwiZ3JlZXRpbmdcXFwiOiAnaGVsbG8nICtcXG4gJ3dvcmxkJ1xcbn1cIiksXG4gICAgICAgICd7XFxuICBcImdyZWV0aW5nXCI6IFwiaGVsbG93b3JsZFwiXFxufSdcbiAgICAgIClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXBhaXIgbWlzc2luZyBjb21tYSBiZXR3ZWVuIGFycmF5IGl0ZW1zJywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYXJyYXlcIjogW3t9e31dfScpLCAne1wiYXJyYXlcIjogW3t9LHt9XX0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYXJyYXlcIjogW3t9IHt9XX0nKSwgJ3tcImFycmF5XCI6IFt7fSwge31dfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhcnJheVwiOiBbe31cXG57fV19JyksICd7XCJhcnJheVwiOiBbe30sXFxue31dfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhcnJheVwiOiBbXFxue31cXG57fVxcbl19JyksICd7XCJhcnJheVwiOiBbXFxue30sXFxue31cXG5dfScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhcnJheVwiOiBbXFxuMVxcbjJcXG5dfScpLCAne1wiYXJyYXlcIjogW1xcbjEsXFxuMlxcbl19JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFycmF5XCI6IFtcXG5cImFcIlxcblwiYlwiXFxuXX0nKSwgJ3tcImFycmF5XCI6IFtcXG5cImFcIixcXG5cImJcIlxcbl19JylcblxuICAgICAgLy8gc2hvdWxkIGxlYXZlIG5vcm1hbCBhcnJheSBhcyBpc1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignW1xcbnt9LFxcbnt9XFxuXScpLCAnW1xcbnt9LFxcbnt9XFxuXScpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwYWlyIG1pc3NpbmcgY29tbWEgYmV0d2VlbiBvYmplY3QgcHJvcGVydGllcycsICgpID0+IHtcbiAgICAgIC8vIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjoyXFxuXCJiXCI6M1xcbn0nKSwgJ3tcImFcIjoyLFxcblwiYlwiOjNcXG59JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJ3tcImFcIjoyXFxuXCJiXCI6M1xcbmM6NH0nKSwgJ3tcImFcIjoyLFxcblwiYlwiOjMsXFxuXCJjXCI6NH0nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlcGFpciBtaXNzaW5nIGNvbG9uIGJldHdlZW4gb2JqZWN0IGtleSBhbmQgdmFsdWUnLCAoKSA9PiB7XG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhXCIgXCJiXCJ9JyksICd7XCJhXCI6IFwiYlwifScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCd7XCJhXCIgMn0nKSwgJ3tcImFcIjogMn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1xcblwiYVwiIFwiYlwiXFxufScpLCAne1xcblwiYVwiOiBcImJcIlxcbn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYVwiIFxcJ2JcXCd9JyksICd7XCJhXCI6IFwiYlwifScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKFwieydhJyAnYid9XCIpLCAne1wiYVwiOiBcImJcIn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne+KAnGHigJ0g4oCcYuKAnX0nKSwgJ3tcImFcIjogXCJiXCJ9JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoXCJ7YSAnYid9XCIpLCAne1wiYVwiOiBcImJcIn0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne2Eg4oCcYuKAnX0nKSwgJ3tcImFcIjogXCJiXCJ9JylcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXBhaXIgbWlzc2luZyBhIGNvbWJpbmF0aW9uIG9mIGNvbW1hLCBxdW90ZXMgYW5kIGJyYWNrZXRzJywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcigne1wiYXJyYXlcIjogW1xcbmFcXG5iXFxuXX0nKSwgJ3tcImFycmF5XCI6IFtcXG5cImFcIixcXG5cImJcIlxcbl19JylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJzFcXG4yJyksICdbXFxuMSxcXG4yXFxuXScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdbYSxiXFxuY10nKSwgJ1tcImFcIixcImJcIixcXG5cImNcIl0nKVxuICAgIH0pXG5cbiAgICBpdCgnc2hvdWxkIHJlcGFpciBuZXdsaW5lIHNlcGFyYXRlZCBqc29uIChmb3IgZXhhbXBsZSBmcm9tIE1vbmdvREIpJywgKCkgPT4ge1xuICAgICAgY29uc3QgdGV4dCA9XG4gICAgICAgICcnICsgJy8qIDEgKi9cXG4nICsgJ3t9XFxuJyArICdcXG4nICsgJy8qIDIgKi9cXG4nICsgJ3t9XFxuJyArICdcXG4nICsgJy8qIDMgKi9cXG4nICsgJ3t9XFxuJ1xuICAgICAgY29uc3QgZXhwZWN0ZWQgPSAnW1xcblxcbnt9LFxcblxcblxcbnt9LFxcblxcblxcbnt9XFxuXFxuXSdcblxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcih0ZXh0KSwgZXhwZWN0ZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwYWlyIG5ld2xpbmUgc2VwYXJhdGVkIGpzb24gaGF2aW5nIGNvbW1hcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHRleHQgPVxuICAgICAgICAnJyArICcvKiAxICovXFxuJyArICd7fSxcXG4nICsgJ1xcbicgKyAnLyogMiAqL1xcbicgKyAne30sXFxuJyArICdcXG4nICsgJy8qIDMgKi9cXG4nICsgJ3t9XFxuJ1xuICAgICAgY29uc3QgZXhwZWN0ZWQgPSAnW1xcblxcbnt9LFxcblxcblxcbnt9LFxcblxcblxcbnt9XFxuXFxuXSdcblxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcih0ZXh0KSwgZXhwZWN0ZWQpXG4gICAgfSlcblxuICAgIGl0KCdzaG91bGQgcmVwYWlyIG5ld2xpbmUgc2VwYXJhdGVkIGpzb24gaGF2aW5nIGNvbW1hcyBhbmQgdHJhaWxpbmcgY29tbWEnLCAoKSA9PiB7XG4gICAgICBjb25zdCB0ZXh0ID1cbiAgICAgICAgJycgKyAnLyogMSAqL1xcbicgKyAne30sXFxuJyArICdcXG4nICsgJy8qIDIgKi9cXG4nICsgJ3t9LFxcbicgKyAnXFxuJyArICcvKiAzICovXFxuJyArICd7fSxcXG4nXG4gICAgICBjb25zdCBleHBlY3RlZCA9ICdbXFxuXFxue30sXFxuXFxuXFxue30sXFxuXFxuXFxue31cXG5cXG5dJ1xuXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKHRleHQpLCBleHBlY3RlZClcbiAgICB9KVxuXG4gICAgaXQoJ3Nob3VsZCByZXBhaXIgYSBjb21tYSBzZXBhcmF0ZWQgbGlzdCB3aXRoIHZhbHVlJywgKCkgPT4ge1xuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignMSwyLDMnKSwgJ1tcXG4xLDIsM1xcbl0nKVxuICAgICAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcignMSwyLDMsJyksICdbXFxuMSwyLDNcXG5dJylcbiAgICAgIHN0cmljdEVxdWFsKGpzb25yZXBhaXIoJzFcXG4yXFxuMycpLCAnW1xcbjEsXFxuMixcXG4zXFxuXScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdhXFxuYicpLCAnW1xcblwiYVwiLFxcblwiYlwiXFxuXScpXG4gICAgICBzdHJpY3RFcXVhbChqc29ucmVwYWlyKCdhLGInKSwgJ1tcXG5cImFcIixcImJcIlxcbl0nKVxuICAgIH0pXG4gIH0pXG5cbiAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBleGNlcHRpb24gaW4gY2FzZSBvZiBub24tcmVwYWlyYWJsZSBpc3N1ZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgdGhyb3dzKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHsgb3V0cHV0OiBqc29ucmVwYWlyKCcnKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ1VuZXhwZWN0ZWQgZW5kIG9mIGpzb24gc3RyaW5nJywgMCkpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJ3tcImFcIiwnKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ0NvbG9uIGV4cGVjdGVkJywgNCkpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJ3s6Mn0nKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ09iamVjdCBrZXkgZXhwZWN0ZWQnLCAxKSlcblxuICAgIHRocm93cyhmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh7IG91dHB1dDoganNvbnJlcGFpcigne1wiYVwiOjIsXScpIH0pXG4gICAgfSwgbmV3IEpTT05SZXBhaXJFcnJvcignVW5leHBlY3RlZCBjaGFyYWN0ZXIgXCJdXCInLCA3KSlcblxuICAgIHRocm93cyhmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh7IG91dHB1dDoganNvbnJlcGFpcigne1wiYVwiIF0nKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ0NvbG9uIGV4cGVjdGVkJywgNSkpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJ3t9fScpIH0pXG4gICAgfSwgbmV3IEpTT05SZXBhaXJFcnJvcignVW5leHBlY3RlZCBjaGFyYWN0ZXIgXCJ9XCInLCAyKSlcblxuICAgIHRocm93cyhmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh7IG91dHB1dDoganNvbnJlcGFpcignWzIsfScpIH0pXG4gICAgfSwgbmV3IEpTT05SZXBhaXJFcnJvcignVW5leHBlY3RlZCBjaGFyYWN0ZXIgXCJ9XCInLCAzKSlcblxuICAgIHRocm93cyhmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh7IG91dHB1dDoganNvbnJlcGFpcignMi4zLjQnKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ1VuZXhwZWN0ZWQgY2hhcmFjdGVyIFwiLlwiJywgMykpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJzIuLjMnKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoXCJJbnZhbGlkIG51bWJlciAnMi4nLCBleHBlY3RpbmcgYSBkaWdpdCBidXQgZ290ICcuJ1wiLCAyKSlcblxuICAgIHRocm93cyhmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZyh7IG91dHB1dDoganNvbnJlcGFpcignMmUzLjQnKSB9KVxuICAgIH0sIG5ldyBKU09OUmVwYWlyRXJyb3IoJ1VuZXhwZWN0ZWQgY2hhcmFjdGVyIFwiLlwiJywgMykpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJzJlJykgfSlcbiAgICB9LCBuZXcgSlNPTlJlcGFpckVycm9yKFwiSW52YWxpZCBudW1iZXIgJzJlJywgZXhwZWN0aW5nIGEgZGlnaXQgYnV0IHJlYWNoZWQgZW5kIG9mIGlucHV0XCIsIDIpKVxuXG4gICAgdGhyb3dzKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHsgb3V0cHV0OiBqc29ucmVwYWlyKCctJykgfSlcbiAgICB9LCBuZXcgSlNPTlJlcGFpckVycm9yKFwiSW52YWxpZCBudW1iZXIgJy0nLCBleHBlY3RpbmcgYSBkaWdpdCBidXQgcmVhY2hlZCBlbmQgb2YgaW5wdXRcIiwgMikpXG5cbiAgICB0aHJvd3MoZnVuY3Rpb24gKCkge1xuICAgICAgY29uc29sZS5sb2coeyBvdXRwdXQ6IGpzb25yZXBhaXIoJ2ZvbyBbJykgfSlcbiAgICB9LCBuZXcgSlNPTlJlcGFpckVycm9yKCdVbmV4cGVjdGVkIGNoYXJhY3RlciBcIltcIicsIDQpKVxuXG4gICAgdGhyb3dzKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHsgb3V0cHV0OiBqc29ucmVwYWlyKCdcIlxcXFx1MjZcIicpIH0pXG4gICAgfSwgbmV3IEpTT05SZXBhaXJFcnJvcignSW52YWxpZCB1bmljb2RlIGNoYXJhY3RlciBcIlxcXFx1MjZcIicsIDEpKVxuXG4gICAgdGhyb3dzKGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnNvbGUubG9nKHsgb3V0cHV0OiBqc29ucmVwYWlyKCdcIlxcXFx1WjAwMFwiJykgfSlcbiAgICB9LCBuZXcgSlNPTlJlcGFpckVycm9yKCdJbnZhbGlkIHVuaWNvZGUgY2hhcmFjdGVyIFwiXFxcXHVaMDAwXCInLCAxKSlcbiAgfSlcbn0pXG5cbmZ1bmN0aW9uIGFzc2VydFJlcGFpcih0ZXh0OiBzdHJpbmcpIHtcbiAgc3RyaWN0RXF1YWwoanNvbnJlcGFpcih0ZXh0KSwgdGV4dClcbn1cbiJdfQ==