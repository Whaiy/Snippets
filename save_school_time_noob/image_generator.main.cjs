const PATH = require("node:path")
const {execSync} = require("node:child_process")
const gm = require("gm")

let src_img_path = process.argv[2]
let tasks_length = process.argv[3]
let out_img_name = process.argv[4]

let helper = {
	title: "学校学生时间管理低手：用一张图片，批量裁剪生成多张，一定比例范围内随机长宽高",
	deploy_cmd : `
		# apt install node
		apt install imagemagick
		apt install graphicsmagick
		npm install gm
	`,
	start_cmd_example: `node main.cjs ./test_img.jpg 10 1145张三.png`
}

async function main(){

	for(let i=0; i<tasks_length; i++){
		let out_dir_name = PATH.dirname(src_img_path) + "/out.d/" + i + "/"
		execSync(`rm -rf ${out_dir_name}; mkdir -p `+ out_dir_name)
	
		let gm_object = gm(src_img_path)

		let src_size = await new Promise( (res, rej)=> {
			gm_object.size((e, v)=>[
				res(v)
			]) 
		})

		let crop_size = () => {
			return [
				// w: 
				src_size.width * 0.8,
				// h: 
				src_size.height * 0.8,
				// x: 
				Math.random() * src_size.width * 0.2,
				// y: 
				Math.random() * src_size.width * 0.2
			]
		}

		console.log(
			"out_path: ", out_dir_name+out_img_name
		)

		gm_object.crop.apply(gm_object, crop_size())
		.write(out_dir_name+out_img_name, ()=>{ })
	}

}

! process.argv[2] ? console.log(helper) :  main()
