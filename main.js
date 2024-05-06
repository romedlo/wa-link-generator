//ts-check

document.addEventListener('DOMContentLoaded', main);

const $ = id => document.querySelector(id);

function main() {
    getCountryCodes().then(countryCodes => {
        for(let code of countryCodes) {
            let container = document.createElement('div');
            container.classList.add('row', 'dropdown-item');
            container.data = code.country;

            let codeContainer = document.createElement('div');
            codeContainer.classList.add('col-3');
            codeContainer.innerText = code.phoneExt;
            container.appendChild(codeContainer);

            let nameContainer = document.createElement('div');
            nameContainer.classList.add('col');
            nameContainer.innerText = code.country;
            container.appendChild(nameContainer);

            container.onclick = () => {
                $('#dropdown-country-code').innerText =
                    $('#dropdown-country-code').value = code.phoneExt;
            }

            $('#list-country-codes').appendChild(container);
        }

        // TODO: Add scroll to specific country in dropdown
    });
    

    $('#form-generate-url').onsubmit = (event) => {
        event.preventDefault();

        let phone = $('#input-phone-number').value?.trim();
        if (phone == null || phone.length == 0) {
            showError('You must enter a phone number');
            return;
        }

        let message = $('#input-message').value?.trim();

        let generatedUrl = generateUrl(phone, message);
        if(generatedUrl == null) {

        }

        $('#generated-url').href =
            $('#generated-url').innerText = generatedUrl;
        $('#result-url').style.display = 'block';
        $('#error-message').style.display = 'none';
    }

    $('#btn-copy-url').onclick = () => {
        let url = $('#generated-url').innerText;
        navigator.clipboard.writeText(url).then(() => {
            let prevContent  = $('#btn-copy-url').innerHTML;
            $('#btn-copy-url').innerText = 'Copied!';
            setTimeout(() => {
                $('#btn-copy-url').innerHTML = prevContent;
            }, 2000);
        });
    }
}

function showError(errorMsg) {
    $('#error-message-text').innerText = errorMsg;
    $('#error-message').style.display = 'block';

    $('#result-url').style.display = 'none';
}

function generateUrl(phone, message) {
    phone = phone.replaceAll(' ', '');
    let url = `https://wa.me/${phone}/`;

    if (message != null && message.length != 0) {
        url += `?text=${message}`;
    }

    return encodeURI(url);
}

async function getCountryCodes() {
    const response = await fetch('./assets/country_codes.json');
    return await response.json();
}
