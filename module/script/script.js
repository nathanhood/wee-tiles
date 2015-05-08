// Wee Tiles (weepower.com)
// Licensed under Apache 2 (http://www.apache.org/licenses/LICENSE-2.0)
// DO NOT MODIFY

Wee.fn.make('tiles', {
	init: function(gridName, obj) {
		var scope = this,
			conf = Wee.$extend({
				columns: 2,
				gridName: gridName,
				gridSelector: 'ref:' + gridName,
				tileSelector: 'ref:weeTile',
				callback: null
			}, obj),
			$grid = $(conf.gridSelector),
			$tiles = $(conf.tileSelector, conf.gridSelector);

		// Add all module classes
		$grid.addClass('wee-grid --columns-' + conf.columns);
		$tiles.addClass('wee-grid__entry');

		// Set controller variables
		this.$set('conf', conf);
		this.$set('$grid', $grid);
		this.$set('$tiles', $tiles);

		// Create grid object in memory if it does not exist
		this.$set(conf.gridName, {
			totalTiles: Wee.$toArray($tiles)
		});

		// Wait for images to load
		this.$private('checkLoadingImages', this.$get('$tiles'), function() {
			scope.$private('buildColumns');

			scope.$private('calculateLayout');
			scope.$private('buildLayout');

			if (conf.callback) {
				conf.callback();
			}
		});
	},
	append: function(gridName, obj) {
		var scope = this,
			conf = Wee.$extend({
				columns: this.$get(gridName).columns,
				gridName: gridName,
				gridSelector: 'ref:' + gridName,
				callback: null
			}, obj),
			$grid = $('ref:' + gridName),
			$tempDiv = Wee.$parseHTML('<div class="wee-tile-is-hidden" data-ref="tempDiv"></div>', true),
			$tiles = obj.tiles;

		// Add new tiles to totalTiles array for update method
		this.$get(gridName).totalTiles.push($tiles);
		this.$set('conf', conf);
		this.$set('$tiles', $tiles);

		// Append temp div to DOM
		$tempDiv.append($tiles);
		$grid.append($tempDiv);

		// Wait for images to load
		this.$private('checkLoadingImages', this.$get('$tiles'), function() {
			var columnData = scope.$private('calculateLayout', true),
				$columns = $('ref:weeColumn');

			scope.$private('buildLayout', columnData);

			// Merge new elements with original grid config - totalHeight already calculated
			scope.$get(gridName).columnData.forEach(function(data, i) {
				data.elements = data.elements.concat(columnData[i].elements);
				data.totalHeight = $columns[i].offsetHeight;
			});

			// Remove temporary div
			$tempDiv.remove();

			if (conf.callback) {
				conf.callback();
			}
		});
	},
	update: function(gridName, columns) {
		var scope = this,
			conf = {
				columns: columns || 2,
				gridName: gridName,
				gridSelector: 'ref:' + gridName,
				tileSelector: 'ref:weeTile'
			},
			$grid = $(conf.gridSelector),
			$tiles = $(conf.tileSelector, conf.gridSelector);

		this.$set('conf', conf);

		// Empty grid
		$grid.empty();
		$grid.append($tiles);
		Wee.$setRef(conf.gridSelector);

		this.$set('$grid', $grid);
		this.$set('$tiles', $tiles);

		// Wait for images to load
		this.$private('checkLoadingImages', this.$get('$tiles'), function() {
			scope.$private('buildColumns');

			scope.$private('calculateLayout', false, true);
			scope.$private('buildLayout');
		});
	}
}, {
	checkLoadingImages: function($tiles, callback) {
		// Find all image paths that exist in grid
		var imgPaths = $tiles.find('img').map(function(el) {
			return el.src;
		});

		// Check that all images in grid have loaded before doing calculations
		Wee.assets.load({
			files: imgPaths,
			success: callback
		});
	},
	buildColumns: function() {
		var columns = [];

		for (var i = 0; i < this.$get('conf').columns; i++) {
			columns.push('<div class="wee-grid__column --columns-' + this.$get('conf').columns + '" data-ref="weeColumn"></div>');
		}

		this.$get('$grid').append(Wee.$parseHTML(columns.join('')));
		Wee.$setRef(this.$get('conf').gridSelector);
	},
	calculateLayout: function(append, update) {
		var restructure = update || false,
			columnData = this.buildColumnDataStructure(restructure),
			columns = this.$get('conf').columns,
			columnWidth = $('ref:weeColumn').last().width(),
			gridConf = this.$get(this.$get('conf').gridName),
			tileHeights;

		tileHeights = this.getTileHeights(this.$get('$tiles'), columnWidth, update);

		// Analyze/distribute tiles
		this.assignTiles(tileHeights, columnData, update);

		if (append) {
			return columnData;
		}

		// Set values for reuse
		gridConf.columnData = columnData;
		gridConf.columns = columns;
	},
	buildLayout: function(data) {
		var $columns = $('ref:weeColumn'),
			gridConf = this.$get(this.$get('conf').gridName),
			columnData = data || gridConf.columnData;

		// Build grid
		columnData.forEach(function(data, i) {
			data.elements.forEach(function(el) {
				// Reset width
				$(el).css('width', '');

				$columns.eq(i).append(el);
			});
		});

		Wee.$setRef();
	},
	buildColumnDataStructure: function(restructure) {
		var data = [],
			conf = this.$get(this.$get('conf').gridName);

		for (var i = 0; i < this.$get('conf').columns; i++) {
			data.push({
				elements: [],
				totalHeight: (conf.columnData && ! restructure) ? conf.columnData[i].totalHeight : 0
			});
		}

		return data;
	},
	getTileHeights: function($tiles, width, restructure) {
		var heights = [],
			gridConf = this.$get(this.$get('conf').gridName);

		if (restructure) {
			gridConf.totalTiles.forEach(function($set) {
				heights.push($set.map(function(el) {
					// Adjust element width before measuring height
					$(el).css('width', width + 'px');

					return el.offsetHeight;
				}));
			});

			return heights;
		} else {
			return $tiles.map(function(el) {
				// Adjust element width before measuring height
				$(el).css('width', width + 'px');

				return el.offsetHeight;
			});
		}
	},
	assignTiles: function(tileHeights, columnData, update) {
		var scope = this,
			gridName = this.$get('conf').gridName,
			gridConf = scope.$get(gridName);

		if (update) {
			tileHeights.forEach(function(set, i) {
				scope.assignTilesLogic(set, columnData, gridConf, update, i);
			});
		} else {
			this.assignTilesLogic(tileHeights, columnData, gridConf);
		}
	},
	assignTilesLogic: function(heights, columnData, gridConf, update, setNumber) {
		var scope = this;

		if (update) {
			gridConf.smallestCol = 0;
		}

		heights.forEach(function(height, i) {
			var smallest = (gridConf.smallestCol || gridConf.smallestCol === 0) ?
				gridConf.smallestCol :
				null;

			columnData.forEach(function(data, j) {
				if (smallest === null ||
					data.totalHeight < columnData[smallest].totalHeight)
				{
					smallest = j;
				}
			});

			if (update) {
				columnData[smallest].elements.push(gridConf.totalTiles[setNumber][i]);
			} else {
				columnData[smallest].elements.push(scope.$get('$tiles')[i]);
			}
			columnData[smallest].totalHeight += height;

			gridConf.smallestCol = smallest;
		});
	}
});