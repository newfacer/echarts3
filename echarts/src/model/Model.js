/**
 * @module echarts/model/Model
 */
define(function (require) {

    var zrUtil = require('zrender/core/util');
    var clazzUtil = require('../util/clazz');

    /**
     * @alias module:echarts/model/Model
     * @constructor
     * @param {Object} option
     * @param {module:echarts/model/Model} [parentModel]
     * @param {module:echarts/model/Global} [ecModel]
     */
    function Model(option, parentModel, ecModel) {
        /**
         * @type {module:echarts/model/Model}
         * @readOnly
         */
        this.parentModel = parentModel;

        /**
         * @type {module:echarts/model/Global}
         * @readOnly
         */
        this.ecModel = ecModel;

        /**
         * @type {Object}
         * @protected
         */
        this.option = option;

        // Simple optimization
        // if (this.init) {
        //     if (arguments.length <= 4) {
        //         this.init(option, parentModel, ecModel, extraOpt);
        //     }
        //     else {
        //         this.init.apply(this, arguments);
        //     }
        // }
    }

    Model.prototype = {

        constructor: Model,

        /**
         * Model 的初始化函数
         * @param {Object} option
         */
        init: null,

        /**
         * 从新的 Option merge
         */
        mergeOption: function (option) {
            zrUtil.merge(this.option, option, true);
        },

        /**通过options的对象名获取对象值
         * @param {string|Array.<string>} path
         * @param {boolean} [ignoreParent=false]
         * @return {*}
         */
        get: function (path, ignoreParent) {
            if (path == null) {
                return this.option;
            }

            return doGet(
                this.option,
                this.parsePath(path),
                !ignoreParent && getParent(this, path)
            );
        },

        /**
         * @param {string} key
         * @param {boolean} [ignoreParent=false]
         * @return {*}
         */
        getShallow: function (key, ignoreParent) {
            var option = this.option;

            var val = option == null ? option : option[key];
            var parentModel = !ignoreParent && getParent(this, key);
            if (val == null && parentModel) {
                val = parentModel.getShallow(key);
            }
            return val;
        },

        /**通过options的对象名获取对象值
         * @param {string|Array.<string>} path
         * @param {module:echarts/model/Model} [parentModel]
         * @return {module:echarts/model/Model}
         */
        getModel: function (path, parentModel) {
            var obj = path == null
                ? this.option
                : doGet(this.option, path = this.parsePath(path));

            var thisParentModel;
            parentModel = parentModel || (
                (thisParentModel = getParent(this, path))
                    && thisParentModel.getModel(path)
            );

            return new Model(obj, parentModel, this.ecModel);
        },

        /**
         * If model has option
         */
        isEmpty: function () {
            return this.option == null;
        },

        restoreData: function () {},

        // Pending
        clone: function () {
            var Ctor = this.constructor;
            return new Ctor(zrUtil.clone(this.option));
        },

        setReadOnly: function (properties) {
            clazzUtil.setReadOnly(this, properties);
        },

        // If path is null/undefined, return null/undefined.
        parsePath: function(path) {
            if (typeof path === 'string') {
                path = path.split('.');
            }
            return path;
        },

        /**
         * @param {Function} getParentMethod
         *        param {Array.<string>|string} path
         *        return {module:echarts/model/Model}
         */
        customizeGetParent: function (getParentMethod) {
            clazzUtil.set(this, 'getParent', getParentMethod);
        }
    };

    function doGet(obj, pathArr, parentModel) {
        for (var i = 0; i < pathArr.length; i++) {
            // Ignore empty
            if (!pathArr[i]) {
                continue;
            }
            // obj could be number/string/... (like 0)
            obj = (obj && typeof obj === 'object') ? obj[pathArr[i]] : null;
            if (obj == null) {
                break;
            }
        }
        if (obj == null && parentModel) {
            obj = parentModel.get(pathArr);
        }
        return obj;
    }

    function getParent(model, path) {
        var getParentMethod = clazzUtil.get(model, 'getParent');
        return getParentMethod ? getParentMethod.call(model, path) : model.parentModel;
    }

    // Enable Model.extend.
    clazzUtil.enableClassExtend(Model);

    var mixin = zrUtil.mixin;
    mixin(Model, require('./mixin/lineStyle'));
    mixin(Model, require('./mixin/areaStyle'));
    mixin(Model, require('./mixin/textStyle'));
    mixin(Model, require('./mixin/itemStyle'));

    return Model;
});