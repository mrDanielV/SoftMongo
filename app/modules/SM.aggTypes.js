// Описание типов операндов агрегации (Aggregation Pipeline stages)
SM.aggTypes = [
	{
		name: '$addFields',
		desc: {
			ru: 'Добавляет в документ новые поля c вычисленным значением, или переназначает значение существующих полей',
			eng: 'Adds new fields to a document whis a computed value, or reassighs an existing fields whis a computed value'
		},
		value: {
			newField: '<expression>'
		}
	},{
		name: '$bucket',
		desc: {
			ru: 'Классифицирует входящие документы по группам, называемым корзинами, на основе заданного выражения и границ корзин и выводит документ для каждой корзины.',
			eng: 'Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries and outputs a document per each bucket'
		},
		value: {
			groupBy: '<expression>',
			boundaries: '[ <lowerbound1>, <lowerbound2>, ... ]',
			default: '<literal>',
			output: { 
				'<output1>': '{ <$accumulator expression> }',
			}
		}
	},{
		name: '$bucketAuto',
		desc: {
			ru: 'Автоматически классифицирует документы по заданному количеству сегментов, пытаясь равномерно распределить их, если это возможно.',
			eng: 'Automatically categorizes documents into a specified number of buckets, attempting even distribution if possible'
		},
		value: {
			groupBy: '<expression>',
			buckets: '<number>',
			output: {
				outputN: {
					accumulatorN: 'expression'
				},
			},
			granularity: '<string>'
		}
	},{
		name: '$changeStream',
		desc: {
			ru: 'Возвращает курсор потока изменений для коллекции, базы данных или всего кластера. Должен использоваться в качестве первого этапа плана агрегации.',
			eng: 'Returns a Change Stream cursor on a collection, a database, or an entire cluster. Must be used as the first stage in an aggregation pipeline.'
		},
		value: {
			allChangesForCluster: '<boolean>',
			fullDocument: '<string>',
			fullDocumentBeforeChange: '<string>',
			resumeAfter: '<int>',
			showExpandedEvents: '<boolean>',
			startAfter: '<document>',
			startAtOperationTime: '<timestamp>'
		}
	},{
		name: '$collStats',
		desc: {
			ru: 'Возвращает статистику по коллекции или представлению',
			eng: 'Returns statistics regarding a collection or view'
		},
		value: {
			latencyStats: { histograms: '<boolean>' },
			storageStats: { scale: '<number>' },
			count: {},
			queryExecStats: {}
		}
	},{
		name: '$count',
		desc: {
			ru: 'Вывести количество документов',
			eng: 'Returns a count of the number of documents input to the stage'
		},
		value: 'count'
	},{
		name: '$facet',
		desc: {
			ru: 'Позволяет параллельно выполнить несколько типов агрегаций на одном наборе документов',
			eng: 'Allows for multiple parellel aggregations to be specified'
		},
		value: {
			outputFieldN: [ 'stage1', 'stageN' ]
		}
	},{
		name: '$geoNear',
		desc: {
			ru: 'Выводит документы в порядке от ближайшего к самому дальнему от указанной точки',
			eng: 'Outputs documents in order of nearest to farthest from a specified point'
		},
		value: {
			near: { type: 'Point', coordinates: [ 'number', 'number' ] },
			distanceField: 'string',
			maxDistance: 'number',
			query: {},
			includeLocs: '',
			num: 'number',
			spherical: 'boolean'
		}
	},{
		name: '$graphLookup',
		desc: {
			ru: 'Выполняет рекурсивный поиск в коллекции с параметрами ограничения поиска по глубине рекурсии и фильтру запросов',
			eng: 'Performs a recursive search on a collection, with options for restricting the search by recursion depth and query filter'
		},
		value: {
			from: 'string',
			startWith: 'expression',
			connectFromField: 'string',
			connectToField: 'string',
			as: 'string',
			maxDepth: 'number',
			depthField: 'string',
			restrictSearchWithMatch: {}
		}
	},{
		name: '$group',
		desc: {
			ru: 'Групировка документов по заданному критерию',
			eng: 'Group documents by a specified expression'
		},
		value: {
			_id: 'expression',
			fieldN: {
				accumulatorN: 'expressionN'
			}
		}
	},{
		name: '$indexStats',
		desc: {
			ru: 'Возвращает статистику использования каждого индекса для коллекции',
			eng: 'Returns statistics regarding the use of each index for the collection'
		},
		value: {}
	},{
		name: '$limit',
		desc: {
			ru: 'Ограничение количества документов в результате запроса',
			eng: 'Limits the number of documents passed to the next stage in the pipeline'
		},
		value: 10
	},{
		name: '$lookup',
		desc: {
			ru: 'Выполняет левое внешнее соединение с коллекцией в той же базе данных для фильтрации документов из «соединенной» коллекции для обработки.',
			eng: 'Performs a left outer join to a collection in the same database to filter in documents from the "joined" collection for processing'
		},
		value: {
			from: 'collection',
			localField: 'field',
			foreignField: 'field',
			as: 'result'
		}
	},{
		name: '$match',
		desc: {
			ru: 'Фильтрует документы, чтобы передать на следующий этап только те документы, которые соответствуют указанным условиям',
			eng: 'Filters the documents to pass only the documents that match the specified condition(s) to the next pipeline stage'
		},
		value: {}
	},{
		name: '$merge',
		desc: {
			ru: 'Сохраняет результат агрегации в указанную коллекцию (расширенный функционал)',
			eng: 'Writes the results of the aggregation pipeline to a specified collection'
		},
		value: {
			into: 'string',
			on: 'string',
			let: 'specification(s)',
			whenMatched: 'string',
			whenNotMatched: 'string'
		}
	},{
		name: '$out',
		desc: {
			ru: 'Сохраняет результат агрегации в указанную коллекцию (простая операция)',
			eng: 'Takes the documents returned by the aggregation pipeline and writes them to a specified collection'
		},
		value: { db: '<output-db>', coll: '<output-collection>' }
	},{
		name: '$planCacheStats',
		desc: {
			ru: 'Возвращает информацию о кэше запросов для коллекции. Этап возвращает документ для каждой записи (запроса) кэша',
			eng: 'Returns plan cache information for a collection. The stage returns a document for each plan cache entry'
		},
		value: {}
	},{
		name: '$project',
		desc: {
			ru: 'Формирует документы с указанными (существующими или новыми, созданными) полями или удаляет указанные поля. 1 для выделения поля, 0 для удаления.',
			eng: 'Passes along the documents with the requested fields to the next stage in the pipeline. The specified fields can be existing fields from the input documents or newly computed fields'
		},
		value: { '<field1>': 1, '<field2>': 1 }
	},{
		name: '$redact',
		desc: {
			ru: 'Ограничивает содержимое документов или фильтрует документы на основе информации, хранящейся в самих документах.',
			eng: 'Restricts the contents of the documents based on information stored in the documents themselves'
		},
		value: '<expression>'
	},{
		name: '$replaceWith',
		desc: {
			ru: 'Заменяет входящий документ указанным (все поля, включая _id)',
			eng: 'Replaces the input document with the specified document'
		},
		value: '<replacementDocument>'
	},{
		name: '$replaceRoot',
		desc: {
			ru: 'Заменяет входящий документ указанным',
			eng: 'Replaces the input document with the specified document'
		},
		value: { newRoot: '<replacementDocument>' }
	},{
		name: '$sample',
		desc: {
			ru: 'Случайным образом выбирает указанное количество документов',
			eng: 'Randomly selects the specified number of documents from the input documents'
		},
		value: { size: 3 }
	},{
		name: '$set',
		desc: {
			ru: 'Добавляет в документ новые поля. Алиас к $addFields',
			eng: 'Adds new fields to documents'
		},
		value: {
			newField: '<expression>'
		}
	},{
		name: '$setWindowFields',
		desc: {
			ru: 'Выполняет операции с указанным диапазоном документов в коллекции,и возвращает результаты на основе выбранного оператора для диапазона.',
			eng: 'Performs operations on a specified span of documents in a collection, known as a window, and returns the results based on the chosen window operator'
		},
		value: {
			partitionBy: '<expression>',
			sortBy: {
				'<sort field 1>': 1,
				'<sort field 2>': -1,
			},
			output: {
				'<output field 1>': {
					'<window operator>': '<window operator parameters>',
					window: {
						documents: '[ <lower boundary>, <upper boundary> ]',
						range: '[ <lower boundary>, <upper boundary> ]',
						unit: '<time unit>'
					}
				}
			}
		}
	},{
		name: '$skip',
		desc: {
			ru: 'Пропустить заданное количество документов при выводе результата запроса',
			eng: 'Skips over the specified number of documents that pass into the stage'
		},
		value: 10
	},{
		name: '$sort',
		desc: {
			ru: 'Сортирует документы по указанным полям и направлению (1 = ASC, -1 = DESC)',
			eng: 'Sorts all input documents and returns them to the pipeline in sorted order'
		},
		value: { '<field1>': -1, '<field2>': 1 }
	},{
		name: '$sortByCount',
		desc: {
			ru: 'Группирует документы на основе значения указанного выражения, а затем вычисляет количество документов в каждой отдельной группе',
			eng: 'Groups incoming documents based on the value of a specified expression, then computes the count of documents in each distinct group'
		},
		value: '<expression> // Например, для того, чтобы понять, сколько разных уникальных значений поля name есть в коллекции, достаточно указать $name'
	},{
		name: '$unionWith',
		desc: {
			ru: 'Объединение записей двух коллекций',
			eng: 'Performs a union of two collections'
		},
		value: { coll: "<collection>", pipeline: [ '<stage1>', '<stage2>' ] }
	},{
		name: '$unset',
		desc: {
			ru: 'Исключает перечисленные поля из документов',
			eng: 'Removes/excludes fields from documents'
		},
		value: ['field1', 'field2']
	},{
		name: '$unwind',
		desc: {
			ru: 'Выводит отдельный документ для каждого элемента указанного массива',
			eng: 'outputs a new document for each element in a specified array'
		},
		value: {
			path: '<field path>',
			includeArrayIndex: '<string>',
			preserveNullAndEmptyArrays: '<boolean>'
		}
	}
];

