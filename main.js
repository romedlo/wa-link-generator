//ts-check

document.addEventListener('DOMContentLoaded', main);

const $ = selector => document.querySelector(selector);

// Detect language and base asset path from current URL
const IS_SPANISH = window.location.pathname.includes('/es');
const BASE_PATH = IS_SPANISH ? '../' : './';

// Load the correct i18n strings for dynamic JS text
async function loadI18n() {
    const lang = IS_SPANISH ? 'es' : 'en';
    const response = await fetch(`${BASE_PATH}assets/i18n/${lang}.json`);
    return await response.json();
}

async function main() {
    const i18n = await loadI18n();

    // Set default value on load
    $('#dropdown-country-code').value = '+505';

    // 1. Fetch & Initialize Country Code Dropdown with Search
    getCountryCodes().then(countryCodes => {
        const listContainer = $('#list-country-codes');

        countryCodes.forEach(code => {
            const item = document.createElement('div');
            item.classList.add('country-item');

            // Country Code Span
            const codeSpan = document.createElement('span');
            codeSpan.classList.add('country-code-val');
            codeSpan.innerText = code.phoneExt;
            item.appendChild(codeSpan);

            // Country Name Span
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('country-name-val');
            nameSpan.innerText = code.country;
            item.appendChild(nameSpan);

            // Click action
            item.onclick = () => {
                $('#dropdown-country-code').innerText =
                    $('#dropdown-country-code').value = code.phoneExt;
                updatePreview();
            };

            listContainer.appendChild(item);
        });

        // Focus search bar when dropdown is opened
        const dropdownBtn = $('#dropdown-country-code');
        dropdownBtn.addEventListener('shown.bs.dropdown', () => {
            $('#search-country-code').focus();
        });
    });

    // 2. Real-time Country Filter / Search Handler
    $('#search-country-code').oninput = (event) => {
        const query = event.target.value.toLowerCase().trim();
        const items = $('#list-country-codes').querySelectorAll('.country-item');

        items.forEach(item => {
            const countryName = item.querySelector('.country-name-val').innerText.toLowerCase();
            const countryCode = item.querySelector('.country-code-val').innerText.toLowerCase();

            if (countryName.includes(query) || countryCode.includes(query)) {
                item.style.setProperty('display', 'flex', 'important');
            } else {
                item.style.setProperty('display', 'none', 'important');
            }
        });
    };

    // 3. Stepper Visual Focus Highlight
    const phoneCard = $('#step-card-phone');
    const messageCard = $('#step-card-message');
    const generateCard = $('#step-card-generate');

    $('#input-phone-number').addEventListener('focus', () => {
        phoneCard.classList.add('active');
    });

    $('#input-phone-number').addEventListener('input', () => {
        if ($('#input-phone-number').value.trim() !== '') {
            messageCard.classList.add('active');
            generateCard.classList.add('active');
        } else {
            messageCard.classList.remove('active');
            generateCard.classList.remove('active');
        }
        updatePreview();
    });

    $('#input-message').addEventListener('focus', () => {
        phoneCard.classList.add('active');
        messageCard.classList.add('active');
        generateCard.classList.add('active');
    });

    $('#input-message').addEventListener('input', () => {
        updatePreview();
    });

    // Mock WhatsApp live preview sync function
    function updatePreview() {
        // 1. Update Contact Name / Phone Number
        let countryCode = $('#dropdown-country-code').value || '+505';
        let phone = $('#input-phone-number').value?.trim() || '';
        
        let previewName = $('#preview-contact-name');
        if (previewName) {
            if (phone === '') {
                previewName.innerText = IS_SPANISH ? 'Contacto de WhatsApp' : 'WhatsApp Contact';
            } else {
                previewName.innerText = `${countryCode} ${phone}`;
            }
        }
        
        // 2. Update Custom Message
        let message = $('#input-message').value || '';
        let waInput = $('#preview-wa-input');
        
        if (waInput) {
            if (message.trim() === '') {
                waInput.innerText = IS_SPANISH ? 'Escribe un mensaje' : 'Type a message';
                waInput.classList.add('placeholder');
            } else {
                waInput.innerText = message;
                waInput.classList.remove('placeholder');
            }
        }
    }

    // Run initial preview setup
    updatePreview();

    // 4. Form Submit & URL Generation Flow
    $('#form-generate-url').onsubmit = (event) => {
        event.preventDefault();

        // Clear existing errors/successes
        $('#error-message').style.display = 'none';
        $('#result-url').style.display = 'none';

        let countryCode = $('#dropdown-country-code').value?.trim();
        if (countryCode == null || countryCode.length == 0) {
            showError(i18n.error.selectCountryCode);
            return;
        }

        let phone = $('#input-phone-number').value?.trim();
        if (phone == null || phone.length == 0) {
            showError(i18n.error.enterPhoneNumber);
            return;
        }

        let message = $('#input-message').value?.trim();

        let generatedUrl = generateUrl(countryCode, phone, message);
        if (generatedUrl == null) {
            showError(i18n.error.generatingUrl);
            return;
        }

        // Show result display
        $('#generated-url').href =
            $('#generated-url').innerText = generatedUrl;

        // Show test URL action link
        $('#btn-test-url').href = generatedUrl;

        // Show QR Code image
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedUrl)}`;
        const qrImg = $('#qr-code-img');
        qrImg.src = qrUrl;
        qrImg.alt = i18n.ui.qrAlt;

        // Render result area
        $('#result-url').style.display = 'block';
        $('#error-message').style.display = 'none';

        // Smooth scroll to the result
        setTimeout(() => {
            $('#result-url').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    // 5. Copy Link to Clipboard Event
    $('#btn-copy-url').onclick = (e) => {
        e.preventDefault();
        let url = $('#generated-url').innerText;
        if (!url) return;

        navigator.clipboard.writeText(url).then(() => {
            let prevContent = $('#btn-copy-url').innerHTML;
            $('#btn-copy-url').innerText = i18n.ui.copied;
            $('#btn-copy-url').classList.add('copied');

            setTimeout(() => {
                $('#btn-copy-url').innerHTML = prevContent;
                $('#btn-copy-url').classList.remove('copied');
            }, 2000);
        });
    };

    // 6. QR Code Download Action
    $('#btn-download-qr').onclick = (e) => {
        e.preventDefault();
        let url = $('#generated-url').innerText;
        let phone = $('#input-phone-number').value?.trim() || 'link';
        if (!url) return;

        const downloadQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        const originalContent = $('#btn-download-qr').innerHTML;
        $('#btn-download-qr').innerText = i18n.ui.downloading;

        fetch(downloadQrUrl)
            .then(res => {
                if (!res.ok) throw new Error('Network response error');
                return res.blob();
            })
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `wa-link-qr-${phone.replaceAll(' ', '')}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                $('#btn-download-qr').innerHTML = originalContent;
            })
            .catch(err => {
                console.error(err);
                $('#btn-download-qr').innerHTML = originalContent;
                alert(i18n.error.downloadQr);
            });
    };
}

function showError(errorMsg) {
    $('#error-message-text').innerText = errorMsg;
    $('#error-message').style.display = 'block';
    $('#result-url').style.display = 'none';

    setTimeout(() => {
        $('#error-message').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function generateUrl(countryCode, phone, message) {
    phone = phone.replaceAll(' ', '');
    let cleanCode = countryCode.replace('+', '');
    let url = `https://wa.me/${cleanCode}${phone}`;

    if (message != null && message.length != 0) {
        url += `?text=${encodeURIComponent(message)}`;
    }

    return url;
}

async function getCountryCodes() {
    const response = await fetch(`${BASE_PATH}assets/country_codes.json`);
    return await response.json();
}
