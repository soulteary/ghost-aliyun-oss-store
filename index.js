/**
 * Ghost v3 Storage Adapter (Aliyun OSS)
 * @author soulteary(soulteary@gmail.com)
 */

const AliOSS = require("ali-oss");
const GhostStorage = require("ghost-storage-base");
const { createReadStream } = require("fs");
const { resolve } = require("path");

class AliOSSAdapter extends GhostStorage {
  constructor(config) {
    super();
    this.config = config || {};
    this.oss = new AliOSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket
    });

    this.ossURL = `${config.bucket}.${config.region}.aliyuncs.com`;
    this.regexp = new RegExp(`^https?://${this.ossURL}`, "i");
    this.domain = config.domain || null;
    this.notfound = config.notfound || null;
  }

  async exists(filename, targetDir = this.getTargetDir("/")) {
    try {
      const { status } = await this.oss.head(resolve(targetDir, filename));
      return status === 404;
    } catch (err) {
      return false;
    }
  }
  delete() {
    // it's unnecessary
    // Ghost missing UX
  }
  serve() {
    return function(req, res, next) {
      next();
    };
  }

  async read(options) {
    try {
      const { meta } = await this.oss.head(options.path);
      if (meta && meta.path) {
        return meta.path;
      } else {
        return this.notfound;
      }
    } catch (err) {
      console.error(`Read Image Error ${err}`);
      return this.notfound;
    }
  }

  async save(image, targetDir = this.getTargetDir("/")) {
    try {
      const filename = await this.getUniqueFileName(image, targetDir);
      const { url } = await this.oss.put(filename, createReadStream(image.path));

      if (url && url.indexOf(`://${this.ossURL}`) > -1) {
        return this.domain ? url.replace(this.regexp, this.domain) : url;
      } else {
        return this.notfound;
      }
    } catch (err) {
      console.error(`Upload Image Error ${err}`);
      return this.notfound;
    }
  }
}

module.exports = AliOSSAdapter;
