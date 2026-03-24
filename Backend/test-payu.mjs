import crypto from 'crypto';

const PAYU_ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID || 'your_key_here';
const PAYU_SALT = process.env.PAYU_SALT || 'your_salt_here';
const PAYU_URL = 'https://secure.payu.in/_payment';

const sha512 = (value) => crypto.createHash('sha512').update(value).digest('hex').toLowerCase();

const txnid = 'test_' + Date.now();
const amount = '100.00';
const productinfo = 'Test Product';
const firstname = 'John';
const email = 'test@example.com';
const phone = '9999999999';
const surl = 'http://localhost:5000/api/payments/payu/callback?result=success';
const furl = 'http://localhost:5000/api/payments/payu/callback?result=failure';
const udf1 = 'internship';
const udf2 = 'test_ref';
const udf3 = '';
const udf4 = '';
const udf5 = '';

const hashString = [
    PAYU_ACCOUNT_ID,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    '', '', '', '', '',
    PAYU_SALT
].join('|');

const hash = sha512(hashString);

async function testPayU() {
    const params = new URLSearchParams();
    params.append('key', PAYU_ACCOUNT_ID);
    params.append('txnid', txnid);
    params.append('amount', amount);
    params.append('productinfo', productinfo);
    params.append('firstname', firstname);
    params.append('email', email);
    params.append('phone', phone);
    params.append('surl', surl);
    params.append('furl', furl);
    params.append('udf1', udf1);
    params.append('udf2', udf2);
    params.append('udf3', udf3);
    params.append('udf4', udf4);
    params.append('udf5', udf5);
    params.append('hash', hash);

    console.log('Parameters:', params.toString());

    const res = await fetch(PAYU_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        redirect: 'manual'
    });

    console.log('Status:', res.status, res.statusText);
    console.log('Headers:');
    res.headers.forEach((val, key) => console.log(key + ': ' + val));

    const text = await res.text();
    console.log('Body snippet:', text.substring(0, 200));
}

testPayU().catch(console.error);
