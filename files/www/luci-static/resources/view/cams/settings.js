'use strict';
'require form';
'require fs';
'require ui';

function okCred(section_id, value) {
	if (value === '' || value == null)
		return true;
	return /^[A-Za-z0-9._~-]{1,32}$/.test(value) ||
		'Дозволені літери, цифри та . _ ~ - (до 32 символів)';
}

return L.view.extend({
	load: function() {
		return L.resolveDefault(fs.exec_direct('/usr/sbin/cams-list'), '');
	},

	render: function(listing) {
		var m, s, o, rows = [];

		String(listing || '').split('\n').forEach(function(line) {
			var f = line.split('|');
			if (f.length < 14)
				return;
			var url = location.protocol + '//' + location.hostname + ':' + f[2] + '/?action=stream';
			rows.push(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, f[13]),
				E('td', { 'class': 'td' }, f[0]),
				E('td', { 'class': 'td' }, E('a', { href: url, target: '_blank' }, url)),
				E('td', { 'class': 'td' }, f[3] ? 'так' : 'ні')
			]));
		});

		var info = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, 'Активні потоки'),
			rows.length ? E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, 'Камера'),
					E('th', { 'class': 'th' }, 'Пристрій'),
					E('th', { 'class': 'th' }, 'Адреса потоку'),
					E('th', { 'class': 'th' }, 'Пароль')
				])
			].concat(rows)) : E('p', {}, E('em', {}, 'Камер не знайдено або всі вимкнені.')),
			E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': ui.createHandlerFn(this, function() {
					return fs.exec('/etc/init.d/cams', [ 'restart' ]).then(function() {
						ui.addNotification(null, E('p', 'Потоки перезапущено. Оновіть сторінку через кілька секунд.'), 'info');
					});
				})
			}, 'Перезапустити потоки')
		]);

		m = new form.Map('cams', 'Вебкамери',
			'Налаштування USB-камер. Нові камери з\'являються тут автоматично після підключення. ' +
			'Зміна роздільності, частоти, порту чи пароля перезапускає потоки (кілька секунд без картинки); ' +
			'зміна яскравості, контрасту тощо застосовується на ходу.');

		s = m.section(form.TypedSection, 'camera', 'Камери');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.DummyValue, 'name', 'Камера');

		o = s.option(form.Flag, 'enabled', 'Увімкнено');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.ListValue, 'res', 'Роздільність');
		[ '160x120', '176x144', '320x240', '352x288', '640x480' ].forEach(function(v) { o.value(v); });
		o.default = '352x288';
		o.description = 'Камери без MJPEG стискаються процесором роутера: 640x480 доступно лише з дуже низькою частотою.';

		o = s.option(form.ListValue, 'fps', 'Частота кадрів');
		[ '5', '10', '15', '20', '25', '30' ].forEach(function(v) { o.value(v); });
		o.default = '5';
		o.description = 'Береться з частот, які підтримує камера (зазвичай 5, 10, 15, 20...). Вище 5 к/с для двох камер на 352x288 зависатиме процесор.';

		o = s.option(form.Value, 'port', 'Порт');
		o.datatype = 'port';
		o.placeholder = 'авто (8080, 8081, ...)';
		o.optional = true;

		o = s.option(form.Value, 'user', 'Логін потоку');
		o.optional = true;
		o.validate = okCred;
		o.description = 'Порожньо = без пароля. Пароль передається без шифрування (HTTP Basic), зберігається у відкритому вигляді в /etc/config/cams.';

		o = s.option(form.Value, 'pass', 'Пароль потоку');
		o.optional = true;
		o.password = true;
		o.validate = okCred;

		o = s.option(form.Value, 'brightness', 'Яскравість');
		o.datatype = 'integer';
		o.optional = true;
		o.placeholder = 'без змін';
		o.description = 'Діапазон залежить від камери (HP Webcam: -64...127).';

		o = s.option(form.Value, 'contrast', 'Контрастність');
		o.datatype = 'integer';
		o.optional = true;
		o.placeholder = 'без змін';

		o = s.option(form.Value, 'saturation', 'Насиченість');
		o.datatype = 'integer';
		o.optional = true;
		o.placeholder = 'без змін';

		o = s.option(form.Value, 'gamma', 'Гамма');
		o.datatype = 'integer';
		o.optional = true;
		o.placeholder = 'без змін';

		o = s.option(form.Value, 'sharpness', 'Різкість');
		o.datatype = 'integer';
		o.optional = true;
		o.placeholder = 'без змін';

		o = s.option(form.ListValue, 'powerline', 'Частота мережі (проти мерехтіння)');
		o.value('', 'без змін');
		o.value('0', 'вимкнено');
		o.value('1', '50 Гц');
		o.value('2', '60 Гц');
		o.optional = true;

		return m.render().then(function(node) {
			return E([ info, node ]);
		});
	}
});
