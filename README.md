# [Wee Tiles](https://www.weepower.com) 1.0.0

### Getting Started
Build grid markup in your template...
```
<div class="wee-grid" data-ref="yourGridName">
	<div data-ref="weeTile"></div>
	<div data-ref="weeTile"></div>
	<div data-ref="weeTile"></div>
	<div data-ref="weeTile"></div>
	...
</div>
```
NOTE: `weeTile` data-ref is required for each tile inside grid.

Call init in your controller...
```
Wee.fn.make('yourController', {
	init: function() {
		Wee.tiles.init('yourGridName', {
			columns: 3,
			callback: function() {
				// Do something after
			}
		});
	}
});
```

Add tiles dynamically to grid (must be DOM nodes)...
```
controllerMethod: function() {
	var $elements = Wee.$parseHTML(
		'<div data-ref="weeTile"></div>...', true
	);

	Wee.tiles.append('yourGridName', {
		tiles: $elements,
		callback: function() {
			// Do something after
		}
	});
}
```

Change the number of columns of an existing grid, retaining the existing tile order...
```
Wee.screen.map([
	{
		max: 2,
		init: false,
		callback: function() {
			Wee.tiles.update('yourGridName', 2);
		}
	},
	{
		min: 3,
		init: false,
		callback: function() {
			Wee.tiles.update('yourGridName', 3);
		}
	}
]);
```
NOTE: When using `Wee.screen.map`, make sure to set `init` to false.
___


## License

Copyright 2015 [Caddis Interactive, LLC](https://www.caddis.co)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.