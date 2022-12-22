"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonrepair = void 0;
const JSONRepairError_js_1 = require("./JSONRepairError.js");
const stringUtils_js_1 = require("./stringUtils.js");
const controlCharacters = {
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t'
};
// map with all escape characters
const escapeCharacters = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
    // note that \u is handled separately in parseString()
};
/**
 * Repair a string containing an invalid JSON document.
 * For example changes JavaScript notation into JSON notation.
 *
 * Example:
 *
 *     try {
 *       const json = "{name: 'John'}"
 *       const repaired = jsonrepair(json)
 *       console.log(repaired)
 *       // '{"name": "John"}'
 *     } catch (err) {
 *       console.error(err)
 *     }
 *
 */
function jsonrepair(text) {
    let i = 0; // current index in text
    let output = ''; // generated output
    const processed = parseValue();
    if (!processed) {
        throwUnexpectedEnd();
    }
    const processedComma = parseCharacter(stringUtils_js_1.codeComma);
    if (processedComma) {
        parseWhitespaceAndSkipComments();
    }
    if (stringUtils_js_1.isStartOfValue(text[i]) && stringUtils_js_1.endsWithCommaOrNewline(output)) {
        // start of a new value after end of the root level object: looks like
        // newline delimited JSON -> turn into a root level array
        if (!processedComma) {
            // repair missing comma
            output = stringUtils_js_1.insertBeforeLastWhitespace(output, ',');
        }
        parseNewlineDelimitedJSON();
    }
    else if (processedComma) {
        // repair: remove trailing comma
        output = stringUtils_js_1.stripLastOccurrence(output, ',');
    }
    if (i >= text.length) {
        // reached the end of the document properly
        return output;
    }
    else {
        throwUnexpectedCharacter();
        return ""; // TS2366: Function lacks ending return statement and return type does not include 'undefined'.
    }
    function parseValue() {
        parseWhitespaceAndSkipComments();
        const processed = parseObject() ||
            parseArray() ||
            parseString() ||
            parseNumber() ||
            parseKeywords() ||
            parseUnquotedString();
        parseWhitespaceAndSkipComments();
        return Boolean(processed).valueOf();
    }
    function parseWhitespaceAndSkipComments() {
        const start = i;
        let changed = parseWhitespace();
        do {
            changed = parseComment();
            if (changed) {
                changed = parseWhitespace();
            }
        } while (changed);
        return i > start;
    }
    function parseWhitespace() {
        let whitespace = '';
        let normal;
        while ((normal = stringUtils_js_1.isWhitespace(text.charCodeAt(i))) || stringUtils_js_1.isSpecialWhitespace(text.charCodeAt(i))) {
            if (normal) {
                whitespace += text[i];
            }
            else {
                // repair special whitespace
                whitespace += ' ';
            }
            i++;
        }
        if (whitespace.length > 0) {
            output += whitespace;
            return true;
        }
        return false;
    }
    function parseComment() {
        // find a block comment '/* ... */'
        if (text.charCodeAt(i) === stringUtils_js_1.codeSlash && text.charCodeAt(i + 1) === stringUtils_js_1.codeAsterisk) {
            // repair block comment by skipping it
            while (i < text.length && !atEndOfBlockComment(text, i)) {
                i++;
            }
            i += 2;
            return true;
        }
        // find a line comment '// ...'
        if (text.charCodeAt(i) === stringUtils_js_1.codeSlash && text.charCodeAt(i + 1) === stringUtils_js_1.codeSlash) {
            // repair line comment by skipping it
            while (i < text.length && text.charCodeAt(i) !== stringUtils_js_1.codeNewline) {
                i++;
            }
            return true;
        }
        return false;
    }
    function parseCharacter(code) {
        if (text.charCodeAt(i) === code) {
            output += text[i];
            i++;
            return true;
        }
        return false;
    }
    function skipCharacter(code) {
        if (text.charCodeAt(i) === code) {
            i++;
            return true;
        }
        return false;
    }
    function skipEscapeCharacter() {
        return skipCharacter(stringUtils_js_1.codeBackslash);
    }
    /**
     * Parse an object like '{"key": "value"}'
     */
    function parseObject() {
        if (text.charCodeAt(i) === stringUtils_js_1.codeOpeningBrace) {
            output += '{';
            i++;
            parseWhitespaceAndSkipComments();
            let initial = true;
            while (i < text.length && text.charCodeAt(i) !== stringUtils_js_1.codeClosingBrace) {
                let processedComma;
                if (!initial) {
                    processedComma = parseCharacter(stringUtils_js_1.codeComma);
                    if (!processedComma) {
                        // repair missing comma
                        output = stringUtils_js_1.insertBeforeLastWhitespace(output, ',');
                    }
                    parseWhitespaceAndSkipComments();
                }
                else {
                    processedComma = true;
                    initial = false;
                }
                const processedKey = parseString() || parseUnquotedString();
                if (!processedKey) {
                    if (text.charCodeAt(i) === stringUtils_js_1.codeClosingBrace ||
                        text.charCodeAt(i) === stringUtils_js_1.codeOpeningBrace ||
                        text.charCodeAt(i) === stringUtils_js_1.codeClosingBracket ||
                        text.charCodeAt(i) === stringUtils_js_1.codeOpeningBracket ||
                        text[i] === undefined) {
                        // repair trailing comma
                        output = stringUtils_js_1.stripLastOccurrence(output, ',');
                    }
                    else {
                        throwObjectKeyExpected();
                    }
                    break;
                }
                parseWhitespaceAndSkipComments();
                const processedColon = parseCharacter(stringUtils_js_1.codeColon);
                if (!processedColon) {
                    if (stringUtils_js_1.isStartOfValue(text[i])) {
                        // repair missing colon
                        output = stringUtils_js_1.insertBeforeLastWhitespace(output, ':');
                    }
                    else {
                        throwColonExpected();
                    }
                }
                const processedValue = parseValue();
                if (!processedValue) {
                    if (processedColon) {
                        throwObjectValueExpected();
                    }
                    else {
                        throwColonExpected();
                    }
                }
            }
            if (text.charCodeAt(i) === stringUtils_js_1.codeClosingBrace) {
                output += '}';
                i++;
            }
            else {
                // repair missing end bracket
                output = stringUtils_js_1.insertBeforeLastWhitespace(output, '}');
            }
            return true;
        }
        return false;
    }
    /**
     * Parse an array like '["item1", "item2", ...]'
     */
    function parseArray() {
        if (text.charCodeAt(i) === stringUtils_js_1.codeOpeningBracket) {
            output += '[';
            i++;
            parseWhitespaceAndSkipComments();
            let initial = true;
            while (i < text.length && text.charCodeAt(i) !== stringUtils_js_1.codeClosingBracket) {
                if (!initial) {
                    const processedComma = parseCharacter(stringUtils_js_1.codeComma);
                    if (!processedComma) {
                        // repair missing comma
                        output = stringUtils_js_1.insertBeforeLastWhitespace(output, ',');
                    }
                }
                else {
                    initial = false;
                }
                const processedValue = parseValue();
                if (!processedValue) {
                    // repair trailing comma
                    output = stringUtils_js_1.stripLastOccurrence(output, ',');
                    break;
                }
            }
            if (text.charCodeAt(i) === stringUtils_js_1.codeClosingBracket) {
                output += ']';
                i++;
            }
            else {
                // repair missing closing array bracket
                output = stringUtils_js_1.insertBeforeLastWhitespace(output, ']');
            }
            return true;
        }
        return false;
    }
    /**
     * Parse and repair Newline Delimited JSON (NDJSON):
     * multiple JSON objects separated by a newline character
     */
    function parseNewlineDelimitedJSON() {
        // repair NDJSON
        let initial = true;
        let processedValue = true;
        while (processedValue) {
            if (!initial) {
                // parse optional comma, insert when missing
                const processedComma = parseCharacter(stringUtils_js_1.codeComma);
                if (!processedComma) {
                    // repair: add missing comma
                    output = stringUtils_js_1.insertBeforeLastWhitespace(output, ',');
                }
            }
            else {
                initial = false;
            }
            processedValue = parseValue();
        }
        if (!processedValue) {
            // repair: remove trailing comma
            output = stringUtils_js_1.stripLastOccurrence(output, ',');
        }
        // repair: wrap the output inside array brackets
        output = `[\n${output}\n]`;
    }
    /**
     * Parse a string enclosed by double quotes "...". Can contain escaped quotes
     * Repair strings enclosed in single quotes or special quotes
     * Repair an escaped string
     */
    function parseString() {
        let skipEscapeChars = text.charCodeAt(i) === stringUtils_js_1.codeBackslash;
        if (skipEscapeChars) {
            // repair: remove the first escape character
            i++;
            skipEscapeChars = true;
        }
        if (stringUtils_js_1.isQuote(text.charCodeAt(i))) {
            const isEndQuote = stringUtils_js_1.isSingleQuote(text.charCodeAt(i)) ? stringUtils_js_1.isSingleQuote : stringUtils_js_1.isDoubleQuote;
            if (text.charCodeAt(i) !== stringUtils_js_1.codeDoubleQuote) {
                // repair non-normalized quote
            }
            output += '"';
            i++;
            while (i < text.length && !isEndQuote(text.charCodeAt(i))) {
                if (text.charCodeAt(i) === stringUtils_js_1.codeBackslash) {
                    const char = text[i + 1];
                    const escapeChar = escapeCharacters[char];
                    if (escapeChar !== undefined) {
                        output += text.slice(i, i + 2);
                        i += 2;
                    }
                    else if (char === 'u') {
                        if (stringUtils_js_1.isHex(text.charCodeAt(i + 2)) &&
                            stringUtils_js_1.isHex(text.charCodeAt(i + 3)) &&
                            stringUtils_js_1.isHex(text.charCodeAt(i + 4)) &&
                            stringUtils_js_1.isHex(text.charCodeAt(i + 5))) {
                            output += text.slice(i, i + 6);
                            i += 6;
                        }
                        else {
                            throwInvalidUnicodeCharacter(i);
                        }
                    }
                    else {
                        // repair invalid escape character: remove it
                        output += char;
                        i += 2;
                    }
                }
                else {
                    const char = text[i];
                    const code = text.charCodeAt(i);
                    if (code === stringUtils_js_1.codeDoubleQuote && text.charCodeAt(i - 1) !== stringUtils_js_1.codeBackslash) {
                        // repair unescaped double quote
                        output += '\\' + char;
                        i++;
                    }
                    else if (stringUtils_js_1.isControlCharacter(code)) {
                        // unescaped control character
                        output += controlCharacters[char];
                        i++;
                    }
                    else {
                        if (!stringUtils_js_1.isValidStringCharacter(code)) {
                            throwInvalidCharacter(char);
                        }
                        output += char;
                        i++;
                    }
                }
                if (skipEscapeChars) {
                    const processed = skipEscapeCharacter();
                    if (processed) {
                        // repair: skipped escape character (nothing to do)
                    }
                }
            }
            if (stringUtils_js_1.isQuote(text.charCodeAt(i))) {
                if (text.charCodeAt(i) !== stringUtils_js_1.codeDoubleQuote) {
                    // repair non-normalized quote
                }
                output += '"';
                i++;
            }
            else {
                // repair missing end quote
                output += '"';
            }
            parseConcatenatedString();
            return true;
        }
        return false;
    }
    /**
     * Repair concatenated strings like "hello" + "world", change this into "helloworld"
     */
    function parseConcatenatedString() {
        let processed = false;
        parseWhitespaceAndSkipComments();
        while (text.charCodeAt(i) === stringUtils_js_1.codePlus) {
            processed = true;
            i++;
            parseWhitespaceAndSkipComments();
            // repair: remove the end quote of the first string
            output = stringUtils_js_1.stripLastOccurrence(output, '"', true);
            const start = output.length;
            parseString();
            // repair: remove the start quote of the second string
            output = stringUtils_js_1.removeAtIndex(output, start, 1);
        }
        return processed;
    }
    /**
     * Parse a number like 2.4 or 2.4e6
     */
    function parseNumber() {
        const start = i;
        if (text.charCodeAt(i) === stringUtils_js_1.codeMinus) {
            i++;
            expectDigit(start);
        }
        if (text.charCodeAt(i) === stringUtils_js_1.codeZero) {
            i++;
        }
        else if (stringUtils_js_1.isNonZeroDigit(text.charCodeAt(i))) {
            i++;
            while (stringUtils_js_1.isDigit(text.charCodeAt(i))) {
                i++;
            }
        }
        if (text.charCodeAt(i) === stringUtils_js_1.codeDot) {
            i++;
            expectDigit(start);
            while (stringUtils_js_1.isDigit(text.charCodeAt(i))) {
                i++;
            }
        }
        if (text.charCodeAt(i) === stringUtils_js_1.codeLowercaseE || text.charCodeAt(i) === stringUtils_js_1.codeUppercaseE) {
            i++;
            if (text.charCodeAt(i) === stringUtils_js_1.codeMinus || text.charCodeAt(i) === stringUtils_js_1.codePlus) {
                i++;
            }
            expectDigit(start);
            while (stringUtils_js_1.isDigit(text.charCodeAt(i))) {
                i++;
            }
        }
        if (i > start) {
            output += text.slice(start, i);
            return true;
        }
        return false;
    }
    /**
     * Parse keywords true, false, null
     * Repair Python keywords True, False, None
     */
    function parseKeywords() {
        return (parseKeyword('true', 'true') ||
            parseKeyword('false', 'false') ||
            parseKeyword('null', 'null') ||
            // repair Python keywords True, False, None
            parseKeyword('True', 'true') ||
            parseKeyword('False', 'false') ||
            parseKeyword('None', 'null'));
    }
    function parseKeyword(name, value) {
        if (text.slice(i, i + name.length) === name) {
            output += value;
            i += name.length;
            return true;
        }
        return false;
    }
    /**
     * Repair and unquoted string by adding quotes around it
     * Repair a MongoDB function call like NumberLong("2")
     * Repair a JSONP function call like callback({...});
     */
    function parseUnquotedString() {
        // note that the symbol can end with whitespaces: we stop at the next delimiter
        const start = i;
        while (i < text.length && !stringUtils_js_1.isDelimiter(text[i])) {
            i++;
        }
        if (i > start) {
            if (text.charCodeAt(i) === stringUtils_js_1.codeOpenParenthesis) {
                // repair a MongoDB function call like NumberLong("2")
                // repair a JSONP function call like callback({...});
                i++;
                parseValue();
                if (text.charCodeAt(i) === stringUtils_js_1.codeCloseParenthesis) {
                    // repair: skip close bracket of function call
                    i++;
                    if (text.charCodeAt(i) === stringUtils_js_1.codeSemicolon) {
                        // repair: skip semicolon after JSONP call
                        i++;
                    }
                }
                return true;
            }
            else {
                // repair unquoted string
                // first, go back to prevent getting trailing whitespaces in the string
                while (stringUtils_js_1.isWhitespace(text.charCodeAt(i - 1)) && i > 0) {
                    i--;
                }
                const symbol = text.slice(start, i);
                output += JSON.stringify(symbol);
                return true;
            }
        }
        return false;
    }
    function expectDigit(start) {
        if (!stringUtils_js_1.isDigit(text.charCodeAt(i))) {
            const numSoFar = text.slice(start, i);
            throw new JSONRepairError_js_1.JSONRepairError(`Invalid number '${numSoFar}', expecting a digit ${got()}`, 2);
        }
    }
    function throwInvalidCharacter(char) {
        throw new JSONRepairError_js_1.JSONRepairError('Invalid character ' + JSON.stringify(char), i);
    }
    function throwUnexpectedCharacter() {
        throw new JSONRepairError_js_1.JSONRepairError('Unexpected character ' + JSON.stringify(text[i]), i);
    }
    function throwUnexpectedEnd() {
        throw new JSONRepairError_js_1.JSONRepairError('Unexpected end of json string', text.length);
    }
    function throwObjectKeyExpected() {
        throw new JSONRepairError_js_1.JSONRepairError('Object key expected', i);
    }
    function throwObjectValueExpected() {
        throw new JSONRepairError_js_1.JSONRepairError('Object value expected', i);
    }
    function throwColonExpected() {
        throw new JSONRepairError_js_1.JSONRepairError('Colon expected', i);
    }
    function throwInvalidUnicodeCharacter(start) {
        let end = start + 2;
        while (/\w/.test(text[end])) {
            end++;
        }
        const chars = text.slice(start, end);
        throw new JSONRepairError_js_1.JSONRepairError(`Invalid unicode character "${chars}"`, i);
    }
    function got() {
        return text[i] ? `but got '${text[i]}'` : 'but reached end of input';
    }
}
exports.jsonrepair = jsonrepair;
function atEndOfBlockComment(text, i) {
    return text[i] === '*' && text[i + 1] === '/';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbnJlcGFpci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImpzb25yZXBhaXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkRBQXNEO0FBQ3RELHFEQXFDeUI7QUFFekIsTUFBTSxpQkFBaUIsR0FBOEI7SUFDbkQsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztJQUNYLElBQUksRUFBRSxLQUFLO0lBQ1gsSUFBSSxFQUFFLEtBQUs7SUFDWCxJQUFJLEVBQUUsS0FBSztDQUNaLENBQUE7QUFFRCxpQ0FBaUM7QUFDakMsTUFBTSxnQkFBZ0IsR0FBOEI7SUFDbEQsR0FBRyxFQUFFLEdBQUc7SUFDUixJQUFJLEVBQUUsSUFBSTtJQUNWLEdBQUcsRUFBRSxHQUFHO0lBQ1IsQ0FBQyxFQUFFLElBQUk7SUFDUCxDQUFDLEVBQUUsSUFBSTtJQUNQLENBQUMsRUFBRSxJQUFJO0lBQ1AsQ0FBQyxFQUFFLElBQUk7SUFDUCxDQUFDLEVBQUUsSUFBSTtJQUNQLHNEQUFzRDtDQUN2RCxDQUFBO0FBRUQ7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLElBQVk7SUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUMsd0JBQXdCO0lBQ2xDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQSxDQUFDLG1CQUFtQjtJQUVuQyxNQUFNLFNBQVMsR0FBRyxVQUFVLEVBQUUsQ0FBQTtJQUM5QixJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2Qsa0JBQWtCLEVBQUUsQ0FBQTtLQUNyQjtJQUVELE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQywwQkFBUyxDQUFDLENBQUE7SUFDaEQsSUFBSSxjQUFjLEVBQUU7UUFDbEIsOEJBQThCLEVBQUUsQ0FBQTtLQUNqQztJQUVELElBQUksK0JBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSx1Q0FBc0IsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUM3RCxzRUFBc0U7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QWtCO1FBQ3pCLE1BQU0sSUFBSSxvQ0FBZSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ2hELENBQUM7SUFFRCxTQUFTLDRCQUE0QixDQUFDLEtBQWE7UUFDakQsSUFBSSxHQUFHLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUNuQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDM0IsR0FBRyxFQUFFLENBQUE7U0FDTjtRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3BDLE1BQU0sSUFBSSxvQ0FBZSxDQUFDLDhCQUE4QixLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN0RSxDQUFDO0lBRUQsU0FBUyxHQUFHO1FBQ1YsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFBO0lBQ3RFLENBQUM7QUFDSCxDQUFDO0FBcGpCRCxnQ0FvakJDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFZLEVBQUUsQ0FBUztJQUNsRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUE7QUFDL0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEpTT05SZXBhaXJFcnJvciB9IGZyb20gJy4vSlNPTlJlcGFpckVycm9yLmpzJ1xuaW1wb3J0IHtcbiAgY29kZUFzdGVyaXNrLFxuICBjb2RlQmFja3NsYXNoLFxuICBjb2RlQ2xvc2VQYXJlbnRoZXNpcyxcbiAgY29kZUNsb3NpbmdCcmFjZSxcbiAgY29kZUNsb3NpbmdCcmFja2V0LFxuICBjb2RlQ29sb24sXG4gIGNvZGVDb21tYSxcbiAgY29kZURvdCxcbiAgY29kZURvdWJsZVF1b3RlLFxuICBjb2RlTG93ZXJjYXNlRSxcbiAgY29kZU1pbnVzLFxuICBjb2RlTmV3bGluZSxcbiAgY29kZU9wZW5pbmdCcmFjZSxcbiAgY29kZU9wZW5pbmdCcmFja2V0LFxuICBjb2RlT3BlblBhcmVudGhlc2lzLFxuICBjb2RlUGx1cyxcbiAgY29kZVNlbWljb2xvbixcbiAgY29kZVNsYXNoLFxuICBjb2RlVXBwZXJjYXNlRSxcbiAgY29kZVplcm8sXG4gIGVuZHNXaXRoQ29tbWFPck5ld2xpbmUsXG4gIGluc2VydEJlZm9yZUxhc3RXaGl0ZXNwYWNlLFxuICBpc0NvbnRyb2xDaGFyYWN0ZXIsXG4gIGlzRGVsaW1pdGVyLFxuICBpc0RpZ2l0LFxuICBpc0RvdWJsZVF1b3RlLFxuICBpc0hleCxcbiAgaXNOb25aZXJvRGlnaXQsXG4gIGlzUXVvdGUsXG4gIGlzU2luZ2xlUXVvdGUsXG4gIGlzU3BlY2lhbFdoaXRlc3BhY2UsXG4gIGlzU3RhcnRPZlZhbHVlLFxuICBpc1ZhbGlkU3RyaW5nQ2hhcmFjdGVyLFxuICBpc1doaXRlc3BhY2UsXG4gIHJlbW92ZUF0SW5kZXgsXG4gIHN0cmlwTGFzdE9jY3VycmVuY2Vcbn0gZnJvbSAnLi9zdHJpbmdVdGlscy5qcydcblxuY29uc3QgY29udHJvbENoYXJhY3RlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICdcXGInOiAnXFxcXGInLFxuICAnXFxmJzogJ1xcXFxmJyxcbiAgJ1xcbic6ICdcXFxcbicsXG4gICdcXHInOiAnXFxcXHInLFxuICAnXFx0JzogJ1xcXFx0J1xufVxuXG4vLyBtYXAgd2l0aCBhbGwgZXNjYXBlIGNoYXJhY3RlcnNcbmNvbnN0IGVzY2FwZUNoYXJhY3RlcnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICdcIic6ICdcIicsXG4gICdcXFxcJzogJ1xcXFwnLFxuICAnLyc6ICcvJyxcbiAgYjogJ1xcYicsXG4gIGY6ICdcXGYnLFxuICBuOiAnXFxuJyxcbiAgcjogJ1xccicsXG4gIHQ6ICdcXHQnXG4gIC8vIG5vdGUgdGhhdCBcXHUgaXMgaGFuZGxlZCBzZXBhcmF0ZWx5IGluIHBhcnNlU3RyaW5nKClcbn1cblxuLyoqXG4gKiBSZXBhaXIgYSBzdHJpbmcgY29udGFpbmluZyBhbiBpbnZhbGlkIEpTT04gZG9jdW1lbnQuXG4gKiBGb3IgZXhhbXBsZSBjaGFuZ2VzIEphdmFTY3JpcHQgbm90YXRpb24gaW50byBKU09OIG5vdGF0aW9uLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICAgIHRyeSB7XG4gKiAgICAgICBjb25zdCBqc29uID0gXCJ7bmFtZTogJ0pvaG4nfVwiXG4gKiAgICAgICBjb25zdCByZXBhaXJlZCA9IGpzb25yZXBhaXIoanNvbilcbiAqICAgICAgIGNvbnNvbGUubG9nKHJlcGFpcmVkKVxuICogICAgICAgLy8gJ3tcIm5hbWVcIjogXCJKb2huXCJ9J1xuICogICAgIH0gY2F0Y2ggKGVycikge1xuICogICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gKiAgICAgfVxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpzb25yZXBhaXIodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IGkgPSAwIC8vIGN1cnJlbnQgaW5kZXggaW4gdGV4dFxuICBsZXQgb3V0cHV0ID0gJycgLy8gZ2VuZXJhdGVkIG91dHB1dFxuXG4gIGNvbnN0IHByb2Nlc3NlZCA9IHBhcnNlVmFsdWUoKVxuICBpZiAoIXByb2Nlc3NlZCkge1xuICAgIHRocm93VW5leHBlY3RlZEVuZCgpXG4gIH1cblxuICBjb25zdCBwcm9jZXNzZWRDb21tYSA9IHBhcnNlQ2hhcmFjdGVyKGNvZGVDb21tYSlcbiAgaWYgKHByb2Nlc3NlZENvbW1hKSB7XG4gICAgcGFyc2VXaGl0ZXNwYWNlQW5kU2tpcENvbW1lbnRzKClcbiAgfVxuXG4gIGlmIChpc1N0YXJ0T2ZWYWx1ZSh0ZXh0W2ldKSAmJiBlbmRzV2l0aENvbW1hT3JOZXdsaW5lKG91dHB1dCkpIHtcbiAgICAvLyBzdGFydCBvZiBhIG5ldyB2YWx1ZSBhZnRlciBlbmQgb2YgdGhlIHJvb3QgbGV2ZWwgb2JqZWN0OiBsb29rcyBsaWtlXG4gICAgLy8gbmV3bGluZSBkZWxpbWl0ZWQgSlNPTiAtPiB0dXJuIGludG8gYSByb290IGxldmVsIGFycmF5XG4gICAgaWYgKCFwcm9jZXNzZWRDb21tYSkge1xuICAgICAgLy8gcmVwYWlyIG1pc3NpbmcgY29tbWFcbiAgICAgIG91dHB1dCA9IGluc2VydEJlZm9yZUxhc3RXaGl0ZXNwYWNlKG91dHB1dCwgJywnKVxuICAgIH1cblxuICAgIHBhcnNlTmV3bGluZURlbGltaXRlZEpTT04oKVxuICB9IGVsc2UgaWYgKHByb2Nlc3NlZENvbW1hKSB7XG4gICAgLy8gcmVwYWlyOiByZW1vdmUgdHJhaWxpbmcgY29tbWFcbiAgICBvdXRwdXQgPSBzdHJpcExhc3RPY2N1cnJlbmNlKG91dHB1dCwgJywnKVxuICB9XG5cbiAgaWYgKGkgPj0gdGV4dC5sZW5ndGgpIHtcbiAgICAvLyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIGRvY3VtZW50IHByb3Blcmx5XG4gICAgcmV0dXJuIG91dHB1dFxuICB9IGVsc2Uge1xuICAgIHRocm93VW5leHBlY3RlZENoYXJhY3RlcigpXG4gICAgcmV0dXJuIFwiXCIgLy8gVFMyMzY2OiBGdW5jdGlvbiBsYWNrcyBlbmRpbmcgcmV0dXJuIHN0YXRlbWVudCBhbmQgcmV0dXJuIHR5cGUgZG9lcyBub3QgaW5jbHVkZSAndW5kZWZpbmVkJy5cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlVmFsdWUoKTogYm9vbGVhbiB7XG4gICAgcGFyc2VXaGl0ZXNwYWNlQW5kU2tpcENvbW1lbnRzKClcbiAgICBjb25zdCBwcm9jZXNzZWQgPVxuICAgICAgcGFyc2VPYmplY3QoKSB8fFxuICAgICAgcGFyc2VBcnJheSgpIHx8XG4gICAgICBwYXJzZVN0cmluZygpIHx8XG4gICAgICBwYXJzZU51bWJlcigpIHx8XG4gICAgICBwYXJzZUtleXdvcmRzKCkgfHxcbiAgICAgIHBhcnNlVW5xdW90ZWRTdHJpbmcoKVxuICAgIHBhcnNlV2hpdGVzcGFjZUFuZFNraXBDb21tZW50cygpXG5cbiAgICByZXR1cm4gQm9vbGVhbihwcm9jZXNzZWQpLnZhbHVlT2YoKVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VXaGl0ZXNwYWNlQW5kU2tpcENvbW1lbnRzKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHN0YXJ0ID0gaVxuXG4gICAgbGV0IGNoYW5nZWQgPSBwYXJzZVdoaXRlc3BhY2UoKVxuICAgIGRvIHtcbiAgICAgIGNoYW5nZWQgPSBwYXJzZUNvbW1lbnQoKVxuICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgY2hhbmdlZCA9IHBhcnNlV2hpdGVzcGFjZSgpXG4gICAgICB9XG4gICAgfSB3aGlsZSAoY2hhbmdlZClcblxuICAgIHJldHVybiBpID4gc3RhcnRcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlV2hpdGVzcGFjZSgpOiBib29sZWFuIHtcbiAgICBsZXQgd2hpdGVzcGFjZSA9ICcnXG4gICAgbGV0IG5vcm1hbDogYm9vbGVhblxuICAgIHdoaWxlICgobm9ybWFsID0gaXNXaGl0ZXNwYWNlKHRleHQuY2hhckNvZGVBdChpKSkpIHx8IGlzU3BlY2lhbFdoaXRlc3BhY2UodGV4dC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKG5vcm1hbCkge1xuICAgICAgICB3aGl0ZXNwYWNlICs9IHRleHRbaV1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlcGFpciBzcGVjaWFsIHdoaXRlc3BhY2VcbiAgICAgICAgd2hpdGVzcGFjZSArPSAnICdcbiAgICAgIH1cblxuICAgICAgaSsrXG4gICAgfVxuXG4gICAgaWYgKHdoaXRlc3BhY2UubGVuZ3RoID4gMCkge1xuICAgICAgb3V0cHV0ICs9IHdoaXRlc3BhY2VcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUNvbW1lbnQoKTogYm9vbGVhbiB7XG4gICAgLy8gZmluZCBhIGJsb2NrIGNvbW1lbnQgJy8qIC4uLiAqLydcbiAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlU2xhc2ggJiYgdGV4dC5jaGFyQ29kZUF0KGkgKyAxKSA9PT0gY29kZUFzdGVyaXNrKSB7XG4gICAgICAvLyByZXBhaXIgYmxvY2sgY29tbWVudCBieSBza2lwcGluZyBpdFxuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiAhYXRFbmRPZkJsb2NrQ29tbWVudCh0ZXh0LCBpKSkge1xuICAgICAgICBpKytcbiAgICAgIH1cbiAgICAgIGkgKz0gMlxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIGZpbmQgYSBsaW5lIGNvbW1lbnQgJy8vIC4uLidcbiAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlU2xhc2ggJiYgdGV4dC5jaGFyQ29kZUF0KGkgKyAxKSA9PT0gY29kZVNsYXNoKSB7XG4gICAgICAvLyByZXBhaXIgbGluZSBjb21tZW50IGJ5IHNraXBwaW5nIGl0XG4gICAgICB3aGlsZSAoaSA8IHRleHQubGVuZ3RoICYmIHRleHQuY2hhckNvZGVBdChpKSAhPT0gY29kZU5ld2xpbmUpIHtcbiAgICAgICAgaSsrXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUNoYXJhY3Rlcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlKSB7XG4gICAgICBvdXRwdXQgKz0gdGV4dFtpXVxuICAgICAgaSsrXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgZnVuY3Rpb24gc2tpcENoYXJhY3Rlcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlKSB7XG4gICAgICBpKytcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBza2lwRXNjYXBlQ2hhcmFjdGVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBza2lwQ2hhcmFjdGVyKGNvZGVCYWNrc2xhc2gpXG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYW4gb2JqZWN0IGxpa2UgJ3tcImtleVwiOiBcInZhbHVlXCJ9J1xuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VPYmplY3QoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZU9wZW5pbmdCcmFjZSkge1xuICAgICAgb3V0cHV0ICs9ICd7J1xuICAgICAgaSsrXG4gICAgICBwYXJzZVdoaXRlc3BhY2VBbmRTa2lwQ29tbWVudHMoKVxuXG4gICAgICBsZXQgaW5pdGlhbCA9IHRydWVcbiAgICAgIHdoaWxlIChpIDwgdGV4dC5sZW5ndGggJiYgdGV4dC5jaGFyQ29kZUF0KGkpICE9PSBjb2RlQ2xvc2luZ0JyYWNlKSB7XG4gICAgICAgIGxldCBwcm9jZXNzZWRDb21tYVxuICAgICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgICBwcm9jZXNzZWRDb21tYSA9IHBhcnNlQ2hhcmFjdGVyKGNvZGVDb21tYSlcbiAgICAgICAgICBpZiAoIXByb2Nlc3NlZENvbW1hKSB7XG4gICAgICAgICAgICAvLyByZXBhaXIgbWlzc2luZyBjb21tYVxuICAgICAgICAgICAgb3V0cHV0ID0gaW5zZXJ0QmVmb3JlTGFzdFdoaXRlc3BhY2Uob3V0cHV0LCAnLCcpXG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcnNlV2hpdGVzcGFjZUFuZFNraXBDb21tZW50cygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvY2Vzc2VkQ29tbWEgPSB0cnVlXG4gICAgICAgICAgaW5pdGlhbCA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9jZXNzZWRLZXkgPSBwYXJzZVN0cmluZygpIHx8IHBhcnNlVW5xdW90ZWRTdHJpbmcoKVxuICAgICAgICBpZiAoIXByb2Nlc3NlZEtleSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZUNsb3NpbmdCcmFjZSB8fFxuICAgICAgICAgICAgdGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlT3BlbmluZ0JyYWNlIHx8XG4gICAgICAgICAgICB0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVDbG9zaW5nQnJhY2tldCB8fFxuICAgICAgICAgICAgdGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlT3BlbmluZ0JyYWNrZXQgfHxcbiAgICAgICAgICAgIHRleHRbaV0gPT09IHVuZGVmaW5lZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLy8gcmVwYWlyIHRyYWlsaW5nIGNvbW1hXG4gICAgICAgICAgICBvdXRwdXQgPSBzdHJpcExhc3RPY2N1cnJlbmNlKG91dHB1dCwgJywnKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvd09iamVjdEtleUV4cGVjdGVkKClcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcnNlV2hpdGVzcGFjZUFuZFNraXBDb21tZW50cygpXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbG9uID0gcGFyc2VDaGFyYWN0ZXIoY29kZUNvbG9uKVxuICAgICAgICBpZiAoIXByb2Nlc3NlZENvbG9uKSB7XG4gICAgICAgICAgaWYgKGlzU3RhcnRPZlZhbHVlKHRleHRbaV0pKSB7XG4gICAgICAgICAgICAvLyByZXBhaXIgbWlzc2luZyBjb2xvblxuICAgICAgICAgICAgb3V0cHV0ID0gaW5zZXJ0QmVmb3JlTGFzdFdoaXRlc3BhY2Uob3V0cHV0LCAnOicpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93Q29sb25FeHBlY3RlZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZFZhbHVlID0gcGFyc2VWYWx1ZSgpXG4gICAgICAgIGlmICghcHJvY2Vzc2VkVmFsdWUpIHtcbiAgICAgICAgICBpZiAocHJvY2Vzc2VkQ29sb24pIHtcbiAgICAgICAgICAgIHRocm93T2JqZWN0VmFsdWVFeHBlY3RlZCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93Q29sb25FeHBlY3RlZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVDbG9zaW5nQnJhY2UpIHtcbiAgICAgICAgb3V0cHV0ICs9ICd9J1xuICAgICAgICBpKytcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlcGFpciBtaXNzaW5nIGVuZCBicmFja2V0XG4gICAgICAgIG91dHB1dCA9IGluc2VydEJlZm9yZUxhc3RXaGl0ZXNwYWNlKG91dHB1dCwgJ30nKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGFuIGFycmF5IGxpa2UgJ1tcIml0ZW0xXCIsIFwiaXRlbTJcIiwgLi4uXSdcbiAgICovXG4gIGZ1bmN0aW9uIHBhcnNlQXJyYXkoKTogYm9vbGVhbiB7XG4gICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZU9wZW5pbmdCcmFja2V0KSB7XG4gICAgICBvdXRwdXQgKz0gJ1snXG4gICAgICBpKytcbiAgICAgIHBhcnNlV2hpdGVzcGFjZUFuZFNraXBDb21tZW50cygpXG5cbiAgICAgIGxldCBpbml0aWFsID0gdHJ1ZVxuICAgICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0LmNoYXJDb2RlQXQoaSkgIT09IGNvZGVDbG9zaW5nQnJhY2tldCkge1xuICAgICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgICBjb25zdCBwcm9jZXNzZWRDb21tYSA9IHBhcnNlQ2hhcmFjdGVyKGNvZGVDb21tYSlcbiAgICAgICAgICBpZiAoIXByb2Nlc3NlZENvbW1hKSB7XG4gICAgICAgICAgICAvLyByZXBhaXIgbWlzc2luZyBjb21tYVxuICAgICAgICAgICAgb3V0cHV0ID0gaW5zZXJ0QmVmb3JlTGFzdFdoaXRlc3BhY2Uob3V0cHV0LCAnLCcpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluaXRpYWwgPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvY2Vzc2VkVmFsdWUgPSBwYXJzZVZhbHVlKClcbiAgICAgICAgaWYgKCFwcm9jZXNzZWRWYWx1ZSkge1xuICAgICAgICAgIC8vIHJlcGFpciB0cmFpbGluZyBjb21tYVxuICAgICAgICAgIG91dHB1dCA9IHN0cmlwTGFzdE9jY3VycmVuY2Uob3V0cHV0LCAnLCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlQ2xvc2luZ0JyYWNrZXQpIHtcbiAgICAgICAgb3V0cHV0ICs9ICddJ1xuICAgICAgICBpKytcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHJlcGFpciBtaXNzaW5nIGNsb3NpbmcgYXJyYXkgYnJhY2tldFxuICAgICAgICBvdXRwdXQgPSBpbnNlcnRCZWZvcmVMYXN0V2hpdGVzcGFjZShvdXRwdXQsICddJylcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBhbmQgcmVwYWlyIE5ld2xpbmUgRGVsaW1pdGVkIEpTT04gKE5ESlNPTik6XG4gICAqIG11bHRpcGxlIEpTT04gb2JqZWN0cyBzZXBhcmF0ZWQgYnkgYSBuZXdsaW5lIGNoYXJhY3RlclxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VOZXdsaW5lRGVsaW1pdGVkSlNPTigpIHtcbiAgICAvLyByZXBhaXIgTkRKU09OXG4gICAgbGV0IGluaXRpYWwgPSB0cnVlXG4gICAgbGV0IHByb2Nlc3NlZFZhbHVlID0gdHJ1ZVxuICAgIHdoaWxlIChwcm9jZXNzZWRWYWx1ZSkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIC8vIHBhcnNlIG9wdGlvbmFsIGNvbW1hLCBpbnNlcnQgd2hlbiBtaXNzaW5nXG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZENvbW1hID0gcGFyc2VDaGFyYWN0ZXIoY29kZUNvbW1hKVxuICAgICAgICBpZiAoIXByb2Nlc3NlZENvbW1hKSB7XG4gICAgICAgICAgLy8gcmVwYWlyOiBhZGQgbWlzc2luZyBjb21tYVxuICAgICAgICAgIG91dHB1dCA9IGluc2VydEJlZm9yZUxhc3RXaGl0ZXNwYWNlKG91dHB1dCwgJywnKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbml0aWFsID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgcHJvY2Vzc2VkVmFsdWUgPSBwYXJzZVZhbHVlKClcbiAgICB9XG5cbiAgICBpZiAoIXByb2Nlc3NlZFZhbHVlKSB7XG4gICAgICAvLyByZXBhaXI6IHJlbW92ZSB0cmFpbGluZyBjb21tYVxuICAgICAgb3V0cHV0ID0gc3RyaXBMYXN0T2NjdXJyZW5jZShvdXRwdXQsICcsJylcbiAgICB9XG5cbiAgICAvLyByZXBhaXI6IHdyYXAgdGhlIG91dHB1dCBpbnNpZGUgYXJyYXkgYnJhY2tldHNcbiAgICBvdXRwdXQgPSBgW1xcbiR7b3V0cHV0fVxcbl1gXG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYSBzdHJpbmcgZW5jbG9zZWQgYnkgZG91YmxlIHF1b3RlcyBcIi4uLlwiLiBDYW4gY29udGFpbiBlc2NhcGVkIHF1b3Rlc1xuICAgKiBSZXBhaXIgc3RyaW5ncyBlbmNsb3NlZCBpbiBzaW5nbGUgcXVvdGVzIG9yIHNwZWNpYWwgcXVvdGVzXG4gICAqIFJlcGFpciBhbiBlc2NhcGVkIHN0cmluZ1xuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VTdHJpbmcoKTogYm9vbGVhbiB7XG4gICAgbGV0IHNraXBFc2NhcGVDaGFycyA9IHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZUJhY2tzbGFzaFxuICAgIGlmIChza2lwRXNjYXBlQ2hhcnMpIHtcbiAgICAgIC8vIHJlcGFpcjogcmVtb3ZlIHRoZSBmaXJzdCBlc2NhcGUgY2hhcmFjdGVyXG4gICAgICBpKytcbiAgICAgIHNraXBFc2NhcGVDaGFycyA9IHRydWVcbiAgICB9XG5cbiAgICBpZiAoaXNRdW90ZSh0ZXh0LmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICBjb25zdCBpc0VuZFF1b3RlID0gaXNTaW5nbGVRdW90ZSh0ZXh0LmNoYXJDb2RlQXQoaSkpID8gaXNTaW5nbGVRdW90ZSA6IGlzRG91YmxlUXVvdGVcblxuICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSAhPT0gY29kZURvdWJsZVF1b3RlKSB7XG4gICAgICAgIC8vIHJlcGFpciBub24tbm9ybWFsaXplZCBxdW90ZVxuICAgICAgfVxuICAgICAgb3V0cHV0ICs9ICdcIidcbiAgICAgIGkrK1xuXG4gICAgICB3aGlsZSAoaSA8IHRleHQubGVuZ3RoICYmICFpc0VuZFF1b3RlKHRleHQuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZUJhY2tzbGFzaCkge1xuICAgICAgICAgIGNvbnN0IGNoYXIgPSB0ZXh0W2kgKyAxXVxuICAgICAgICAgIGNvbnN0IGVzY2FwZUNoYXIgPSBlc2NhcGVDaGFyYWN0ZXJzW2NoYXJdXG4gICAgICAgICAgaWYgKGVzY2FwZUNoYXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3V0cHV0ICs9IHRleHQuc2xpY2UoaSwgaSArIDIpXG4gICAgICAgICAgICBpICs9IDJcbiAgICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09ICd1Jykge1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpc0hleCh0ZXh0LmNoYXJDb2RlQXQoaSArIDIpKSAmJlxuICAgICAgICAgICAgICBpc0hleCh0ZXh0LmNoYXJDb2RlQXQoaSArIDMpKSAmJlxuICAgICAgICAgICAgICBpc0hleCh0ZXh0LmNoYXJDb2RlQXQoaSArIDQpKSAmJlxuICAgICAgICAgICAgICBpc0hleCh0ZXh0LmNoYXJDb2RlQXQoaSArIDUpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIG91dHB1dCArPSB0ZXh0LnNsaWNlKGksIGkgKyA2KVxuICAgICAgICAgICAgICBpICs9IDZcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRocm93SW52YWxpZFVuaWNvZGVDaGFyYWN0ZXIoaSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcmVwYWlyIGludmFsaWQgZXNjYXBlIGNoYXJhY3RlcjogcmVtb3ZlIGl0XG4gICAgICAgICAgICBvdXRwdXQgKz0gY2hhclxuICAgICAgICAgICAgaSArPSAyXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGNoYXIgPSB0ZXh0W2ldXG4gICAgICAgICAgY29uc3QgY29kZSA9IHRleHQuY2hhckNvZGVBdChpKVxuXG4gICAgICAgICAgaWYgKGNvZGUgPT09IGNvZGVEb3VibGVRdW90ZSAmJiB0ZXh0LmNoYXJDb2RlQXQoaSAtIDEpICE9PSBjb2RlQmFja3NsYXNoKSB7XG4gICAgICAgICAgICAvLyByZXBhaXIgdW5lc2NhcGVkIGRvdWJsZSBxdW90ZVxuICAgICAgICAgICAgb3V0cHV0ICs9ICdcXFxcJyArIGNoYXJcbiAgICAgICAgICAgIGkrK1xuICAgICAgICAgIH0gZWxzZSBpZiAoaXNDb250cm9sQ2hhcmFjdGVyKGNvZGUpKSB7XG4gICAgICAgICAgICAvLyB1bmVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJcbiAgICAgICAgICAgIG91dHB1dCArPSBjb250cm9sQ2hhcmFjdGVyc1tjaGFyXVxuICAgICAgICAgICAgaSsrXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghaXNWYWxpZFN0cmluZ0NoYXJhY3Rlcihjb2RlKSkge1xuICAgICAgICAgICAgICB0aHJvd0ludmFsaWRDaGFyYWN0ZXIoY2hhcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dHB1dCArPSBjaGFyXG4gICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2tpcEVzY2FwZUNoYXJzKSB7XG4gICAgICAgICAgY29uc3QgcHJvY2Vzc2VkID0gc2tpcEVzY2FwZUNoYXJhY3RlcigpXG4gICAgICAgICAgaWYgKHByb2Nlc3NlZCkge1xuICAgICAgICAgICAgLy8gcmVwYWlyOiBza2lwcGVkIGVzY2FwZSBjaGFyYWN0ZXIgKG5vdGhpbmcgdG8gZG8pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1F1b3RlKHRleHQuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSAhPT0gY29kZURvdWJsZVF1b3RlKSB7XG4gICAgICAgICAgLy8gcmVwYWlyIG5vbi1ub3JtYWxpemVkIHF1b3RlXG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0ICs9ICdcIidcbiAgICAgICAgaSsrXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyByZXBhaXIgbWlzc2luZyBlbmQgcXVvdGVcbiAgICAgICAgb3V0cHV0ICs9ICdcIidcbiAgICAgIH1cblxuICAgICAgcGFyc2VDb25jYXRlbmF0ZWRTdHJpbmcoKVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIFJlcGFpciBjb25jYXRlbmF0ZWQgc3RyaW5ncyBsaWtlIFwiaGVsbG9cIiArIFwid29ybGRcIiwgY2hhbmdlIHRoaXMgaW50byBcImhlbGxvd29ybGRcIlxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VDb25jYXRlbmF0ZWRTdHJpbmcoKTogYm9vbGVhbiB7XG4gICAgbGV0IHByb2Nlc3NlZCA9IGZhbHNlXG5cbiAgICBwYXJzZVdoaXRlc3BhY2VBbmRTa2lwQ29tbWVudHMoKVxuICAgIHdoaWxlICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVQbHVzKSB7XG4gICAgICBwcm9jZXNzZWQgPSB0cnVlXG4gICAgICBpKytcbiAgICAgIHBhcnNlV2hpdGVzcGFjZUFuZFNraXBDb21tZW50cygpXG5cbiAgICAgIC8vIHJlcGFpcjogcmVtb3ZlIHRoZSBlbmQgcXVvdGUgb2YgdGhlIGZpcnN0IHN0cmluZ1xuICAgICAgb3V0cHV0ID0gc3RyaXBMYXN0T2NjdXJyZW5jZShvdXRwdXQsICdcIicsIHRydWUpXG4gICAgICBjb25zdCBzdGFydCA9IG91dHB1dC5sZW5ndGhcbiAgICAgIHBhcnNlU3RyaW5nKClcblxuICAgICAgLy8gcmVwYWlyOiByZW1vdmUgdGhlIHN0YXJ0IHF1b3RlIG9mIHRoZSBzZWNvbmQgc3RyaW5nXG4gICAgICBvdXRwdXQgPSByZW1vdmVBdEluZGV4KG91dHB1dCwgc3RhcnQsIDEpXG4gICAgfVxuXG4gICAgcmV0dXJuIHByb2Nlc3NlZFxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGEgbnVtYmVyIGxpa2UgMi40IG9yIDIuNGU2XG4gICAqL1xuICBmdW5jdGlvbiBwYXJzZU51bWJlcigpOiBib29sZWFuIHtcbiAgICBjb25zdCBzdGFydCA9IGlcbiAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGkpID09PSBjb2RlTWludXMpIHtcbiAgICAgIGkrK1xuICAgICAgZXhwZWN0RGlnaXQoc3RhcnQpXG4gICAgfVxuXG4gICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZVplcm8pIHtcbiAgICAgIGkrK1xuICAgIH0gZWxzZSBpZiAoaXNOb25aZXJvRGlnaXQodGV4dC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaSsrXG4gICAgICB3aGlsZSAoaXNEaWdpdCh0ZXh0LmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICAgIGkrK1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVEb3QpIHtcbiAgICAgIGkrK1xuICAgICAgZXhwZWN0RGlnaXQoc3RhcnQpXG4gICAgICB3aGlsZSAoaXNEaWdpdCh0ZXh0LmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICAgIGkrK1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVMb3dlcmNhc2VFIHx8IHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZVVwcGVyY2FzZUUpIHtcbiAgICAgIGkrK1xuICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZU1pbnVzIHx8IHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZVBsdXMpIHtcbiAgICAgICAgaSsrXG4gICAgICB9XG4gICAgICBleHBlY3REaWdpdChzdGFydClcbiAgICAgIHdoaWxlIChpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgaSsrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGkgPiBzdGFydCkge1xuICAgICAgb3V0cHV0ICs9IHRleHQuc2xpY2Uoc3RhcnQsIGkpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGtleXdvcmRzIHRydWUsIGZhbHNlLCBudWxsXG4gICAqIFJlcGFpciBQeXRob24ga2V5d29yZHMgVHJ1ZSwgRmFsc2UsIE5vbmVcbiAgICovXG4gIGZ1bmN0aW9uIHBhcnNlS2V5d29yZHMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHBhcnNlS2V5d29yZCgndHJ1ZScsICd0cnVlJykgfHxcbiAgICAgIHBhcnNlS2V5d29yZCgnZmFsc2UnLCAnZmFsc2UnKSB8fFxuICAgICAgcGFyc2VLZXl3b3JkKCdudWxsJywgJ251bGwnKSB8fFxuICAgICAgLy8gcmVwYWlyIFB5dGhvbiBrZXl3b3JkcyBUcnVlLCBGYWxzZSwgTm9uZVxuICAgICAgcGFyc2VLZXl3b3JkKCdUcnVlJywgJ3RydWUnKSB8fFxuICAgICAgcGFyc2VLZXl3b3JkKCdGYWxzZScsICdmYWxzZScpIHx8XG4gICAgICBwYXJzZUtleXdvcmQoJ05vbmUnLCAnbnVsbCcpXG4gICAgKVxuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VLZXl3b3JkKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmICh0ZXh0LnNsaWNlKGksIGkgKyBuYW1lLmxlbmd0aCkgPT09IG5hbWUpIHtcbiAgICAgIG91dHB1dCArPSB2YWx1ZVxuICAgICAgaSArPSBuYW1lLmxlbmd0aFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBhaXIgYW5kIHVucXVvdGVkIHN0cmluZyBieSBhZGRpbmcgcXVvdGVzIGFyb3VuZCBpdFxuICAgKiBSZXBhaXIgYSBNb25nb0RCIGZ1bmN0aW9uIGNhbGwgbGlrZSBOdW1iZXJMb25nKFwiMlwiKVxuICAgKiBSZXBhaXIgYSBKU09OUCBmdW5jdGlvbiBjYWxsIGxpa2UgY2FsbGJhY2soey4uLn0pO1xuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VVbnF1b3RlZFN0cmluZygpIHtcbiAgICAvLyBub3RlIHRoYXQgdGhlIHN5bWJvbCBjYW4gZW5kIHdpdGggd2hpdGVzcGFjZXM6IHdlIHN0b3AgYXQgdGhlIG5leHQgZGVsaW1pdGVyXG4gICAgY29uc3Qgc3RhcnQgPSBpXG4gICAgd2hpbGUgKGkgPCB0ZXh0Lmxlbmd0aCAmJiAhaXNEZWxpbWl0ZXIodGV4dFtpXSkpIHtcbiAgICAgIGkrK1xuICAgIH1cblxuICAgIGlmIChpID4gc3RhcnQpIHtcbiAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaSkgPT09IGNvZGVPcGVuUGFyZW50aGVzaXMpIHtcbiAgICAgICAgLy8gcmVwYWlyIGEgTW9uZ29EQiBmdW5jdGlvbiBjYWxsIGxpa2UgTnVtYmVyTG9uZyhcIjJcIilcbiAgICAgICAgLy8gcmVwYWlyIGEgSlNPTlAgZnVuY3Rpb24gY2FsbCBsaWtlIGNhbGxiYWNrKHsuLi59KTtcbiAgICAgICAgaSsrXG5cbiAgICAgICAgcGFyc2VWYWx1ZSgpXG5cbiAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZUNsb3NlUGFyZW50aGVzaXMpIHtcbiAgICAgICAgICAvLyByZXBhaXI6IHNraXAgY2xvc2UgYnJhY2tldCBvZiBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgaSsrXG4gICAgICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpKSA9PT0gY29kZVNlbWljb2xvbikge1xuICAgICAgICAgICAgLy8gcmVwYWlyOiBza2lwIHNlbWljb2xvbiBhZnRlciBKU09OUCBjYWxsXG4gICAgICAgICAgICBpKytcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gcmVwYWlyIHVucXVvdGVkIHN0cmluZ1xuXG4gICAgICAgIC8vIGZpcnN0LCBnbyBiYWNrIHRvIHByZXZlbnQgZ2V0dGluZyB0cmFpbGluZyB3aGl0ZXNwYWNlcyBpbiB0aGUgc3RyaW5nXG4gICAgICAgIHdoaWxlIChpc1doaXRlc3BhY2UodGV4dC5jaGFyQ29kZUF0KGkgLSAxKSkgJiYgaSA+IDApIHtcbiAgICAgICAgICBpLS1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN5bWJvbCA9IHRleHQuc2xpY2Uoc3RhcnQsIGkpXG4gICAgICAgIG91dHB1dCArPSBKU09OLnN0cmluZ2lmeShzeW1ib2wpXG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBmdW5jdGlvbiBleHBlY3REaWdpdChzdGFydDogbnVtYmVyKSB7XG4gICAgaWYgKCFpc0RpZ2l0KHRleHQuY2hhckNvZGVBdChpKSkpIHtcbiAgICAgIGNvbnN0IG51bVNvRmFyID0gdGV4dC5zbGljZShzdGFydCwgaSlcbiAgICAgIHRocm93IG5ldyBKU09OUmVwYWlyRXJyb3IoYEludmFsaWQgbnVtYmVyICcke251bVNvRmFyfScsIGV4cGVjdGluZyBhIGRpZ2l0ICR7Z290KCl9YCwgMilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0aHJvd0ludmFsaWRDaGFyYWN0ZXIoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhyb3cgbmV3IEpTT05SZXBhaXJFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgJyArIEpTT04uc3RyaW5naWZ5KGNoYXIpLCBpKVxuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dVbmV4cGVjdGVkQ2hhcmFjdGVyKCkge1xuICAgIHRocm93IG5ldyBKU09OUmVwYWlyRXJyb3IoJ1VuZXhwZWN0ZWQgY2hhcmFjdGVyICcgKyBKU09OLnN0cmluZ2lmeSh0ZXh0W2ldKSwgaSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93VW5leHBlY3RlZEVuZCgpIHtcbiAgICB0aHJvdyBuZXcgSlNPTlJlcGFpckVycm9yKCdVbmV4cGVjdGVkIGVuZCBvZiBqc29uIHN0cmluZycsIHRleHQubGVuZ3RoKVxuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dPYmplY3RLZXlFeHBlY3RlZCgpIHtcbiAgICB0aHJvdyBuZXcgSlNPTlJlcGFpckVycm9yKCdPYmplY3Qga2V5IGV4cGVjdGVkJywgaSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93T2JqZWN0VmFsdWVFeHBlY3RlZCgpIHtcbiAgICB0aHJvdyBuZXcgSlNPTlJlcGFpckVycm9yKCdPYmplY3QgdmFsdWUgZXhwZWN0ZWQnLCBpKVxuICB9XG5cbiAgZnVuY3Rpb24gdGhyb3dDb2xvbkV4cGVjdGVkKCkge1xuICAgIHRocm93IG5ldyBKU09OUmVwYWlyRXJyb3IoJ0NvbG9uIGV4cGVjdGVkJywgaSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRocm93SW52YWxpZFVuaWNvZGVDaGFyYWN0ZXIoc3RhcnQ6IG51bWJlcikge1xuICAgIGxldCBlbmQgPSBzdGFydCArIDJcbiAgICB3aGlsZSAoL1xcdy8udGVzdCh0ZXh0W2VuZF0pKSB7XG4gICAgICBlbmQrK1xuICAgIH1cbiAgICBjb25zdCBjaGFycyA9IHRleHQuc2xpY2Uoc3RhcnQsIGVuZClcbiAgICB0aHJvdyBuZXcgSlNPTlJlcGFpckVycm9yKGBJbnZhbGlkIHVuaWNvZGUgY2hhcmFjdGVyIFwiJHtjaGFyc31cImAsIGkpXG4gIH1cblxuICBmdW5jdGlvbiBnb3QoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGV4dFtpXSA/IGBidXQgZ290ICcke3RleHRbaV19J2AgOiAnYnV0IHJlYWNoZWQgZW5kIG9mIGlucHV0J1xuICB9XG59XG5cbmZ1bmN0aW9uIGF0RW5kT2ZCbG9ja0NvbW1lbnQodGV4dDogc3RyaW5nLCBpOiBudW1iZXIpIHtcbiAgcmV0dXJuIHRleHRbaV0gPT09ICcqJyAmJiB0ZXh0W2kgKyAxXSA9PT0gJy8nXG59XG4iXX0=