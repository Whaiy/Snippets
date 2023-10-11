"use strict"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const net = require("node:net")
const http2 = require("node:http2")
const http = require("node:http")
const { readFileSync, createReadStream, createWriteStream, unlinkSync} = require("node:fs");
const cluster = require("node:cluster");

const config = require("main/config.cjs");
const cpus_length = require("node:os").cpus().length;
let proc_num = Math.floor(cpus_length / 3) || 1;
const url_format = require("main/mod/lib/url_format.cjs")

// main
if ( cluster.isPrimary){
    for(let i=0; i<proc_num; i++ ){
        cluster.fork()
    }

    let primary_unique_task_map = { }
    let count_uid_generator = require("main/mod/lib/uid_generator.cjs").count_generator

    let ipc_primary_msg_handlers = {
        broadcast(
            msg, 
            procs, 
            id, 
            handle, 
            controller = { 
                continue_ctl(msg, procs, id, handle){ return false }, 
                break_ctl(msg, procs, id, handle){ return false }
            }, 
        ){
            for(let i in procs){
                if ( controller.continue_ctl(msg, procs, id, handle) ) {
                    continue
                } else if ( controller.break_ctl(msg, procs, id, handle) ) {
                    break
                }
                procs[i].send(msg, handle)
            }
        },
        bl_start(bl_start_msg, procs, id, handle){

            let THIS = this || ipc_primary_msg_handlers;
            let bl_start_id = count_uid_generator.get()
                primary_unique_task_map [ bl_start_id ] = {
                    countor: 0,
                    task_size: bl_start_msg .svcs.length,
                    bl_src_req_wid: bl_start_msg.from.wid ,
                    bl_src_req_id: bl_start_msg .bl_src_req_id,
                    connections_descs: {}
                }
            let bl_start_primary_scope_clean_handler_id = count_uid_generator.get()
          
            let threadpool_task_distr = (tasks_length, threads_length, action) => { // round-robin
                for(let task_i = 0, thread_i = 0; task_i < tasks_length; task_i ++, thread_i ++){
                    action(task_i, thread_i)
                    if(thread_i == threads_length - 1){
                        thread_i = 0
                    }
                }
            }

            let bl_start_unit_msg_distr = (task_id, thread_i)=>{
                // bl unit status storage init
                let bl_unit_id = count_uid_generator.get()

                primary_unique_task_map [ bl_start_id ] [ bl_unit_id ] = {
                    bl_start_id, // primary scope
                    bl_src_req_id: bl_start_msg.bl_src_req_id, // sub req scope
                    bl_unit_id, // sub unit scop
                    bl_wid: bl_start_msg ?.from ?.wid, bl_pid: bl_start_msg ?.from ?.pid // sub 
                }
                // bl unit task distr
                let bl_start_unit_ok_msg = {
                    ...bl_start_msg,
                    svc: bl_start_msg .svcs [ task_id ],
                    bl_start_id,
                    bl_unit_id,
                    sn: "bl_start",
                    bl_start_primary_scope_clean_handler_id
                }

                procs [thread_i + 1]. send (bl_start_unit_ok_msg)
            }

            THIS [ bl_start_primary_scope_clean_handler_id ] = (msg) => {
                count_uid_generator.free(bl_start_id)
                for(let bl_unit_id in primary_unique_task_map [ bl_start_id] ){
                    count_uid_generator.free(bl_unit_id)
                }
                count_uid_generator.free(bl_start_primary_scope_clean_handler_id)
                delete primary_unique_task_map [ bl_start_id ]
                delete THIS [ bl_start_primary_scope_clean_handler_id ]
            }

            let bl_start_unit_err_msg = {}

            let msg_validate_expect = [
                bl_start_msg?.hasOwnProperty("svcs")
            ] .every(v=>v||v?.())

            msg_validate_expect && threadpool_task_distr(bl_start_msg.svcs.length, proc_num, bl_start_unit_msg_distr)

        },
        bl_staus(bl_status_up_msg, procs, id, handle){

            console.log(
                "primary proc > ipc_primary_msg_handlers : bl_status() : bl_status_up_msg; ", primary_unique_task_map [ bl_status_up_msg . bl_start_id ]
            )
            
            let connection_ds = primary_unique_task_map [ bl_status_up_msg . bl_start_id ]

            // TODO check where is release allready: TypeError: Cannot read properties
            connection_ds .countor ++

            if ( bl_status_up_msg .bl_rule == "first_responsed" && connection_ds .countor == 1 ){
                // first connection in
                let bl_unit_status_updated_msg = {
                    ...bl_status_up_msg,
                    sn: bl_status_up_msg .bl_unit_status_checker_id, // tmp ipc channel reused 
                    // default : bl_src_req_id: bl_status_up_msg .bl_src_req_id, // tmp ipc channel reused
                    first_connection_bl_unit_id: bl_status_up_msg .bl_unit_id, 
                    bl_state: "ok",
                    // pipeline addrs
                }

                // console.log(
                //     "primary proc > ipc_primary_msg_handlers : bl_status() : bl_unit_status_updated_msg; ", bl_unit_status_updated_msg
                // )

                this.broadcast(bl_unit_status_updated_msg, procs, id, handle)
                // clean this bl unit 
            } else if ( bl_status_up_msg.bl_rule == "cluster" || bl_status_up_msg.bl_rule == "all_transmit" ) {
                if ( connection_ds .countor == connection_ds .task_size ) {
                    // all bl_unit task preared
                    // timeout by bl_unit self | TODO: dead proc warnning !!!
                }
                // update this bl_unit task status
            }

            // loop weight scope | stage : single proc & sync storage

		}
    }

    for(let id in cluster.workers){
        cluster.workers[id].addListener("message", (msg, handle)=>{
            ipc_primary_msg_handlers [ msg.sn ] 
            ?. (msg, cluster.workers, id, handle)
        })
    }

}else{
// sub

    let count_uid_generator = require("main/mod/lib/uid_generator.cjs").count_generator
    let sub_unique_task_map = {}
    let sub_sr_bind_addr = `/tmp/bl_unit_pipe_sr_${cluster.worker.id}.sock`

    let bl_units = {
        http2s(svc, bl_start_distr_msg /* primary > bl_start > bl_start_unit_msg_distr > bl_start_unit_ok_msg */ ){
			let bl_unit_id = bl_start_distr_msg .bl_unit_id;
			let end_socket_session = http2.connect(svc.api)

            // console.log(
            //     "sub proc > ipc_sub_msg_handlers: bl_start > bl_units: http2s: bl_start_distr_msg: ", bl_start_distr_msg
            // )

			end_socket_session.on("connect", (h2cs, sock)=>{
                console.log(
                    "sub proc > ipc_sub_msg_handlers: bl_start > bl_units: http2s:  first connection: bl_start_distr_msg: ", bl_start_distr_msg
                )

                sub_unique_task_map [ bl_unit_id ] = {
                    end_socket_session,
                }
				
                let bl_unit_status_checker_id = count_uid_generator.get()
                let bl_status_up_msg = {
                    ...bl_start_distr_msg,
					sn: "bl_staus",
					sub_sr_bind_addr,
                    bl_unit_status_checker_id
				}

                ipc_sub_msg_handlers [ bl_unit_status_checker_id ] = bl_status_msg=>{

                    if ( bl_unit_id != bl_status_msg.first_connection_bl_unit_id ) {
                        // not first-responsed connection
                        count_uid_generator.free ( bl_unit_status_checker_id )
                        delete ipc_sub_msg_handlers [ bl_unit_status_checker_id ]
                        delete sub_unique_task_map [ bl_unit_id ]
                    }

                }

                process.send(bl_status_up_msg)

			})

        },
    }

    let ipc_sub_msg_handlers = {
        bl_start(bl_start_distr_msg){
            // TODO parse msg
			bl_units.http2s(bl_start_distr_msg.svc, bl_start_distr_msg)
        }
    }

    let sub_req_handlers = {
        // @url : protocl://domain/bl_pipeline
        "bl_pipeline"(req, res, bl_unit_id){
            // proxy_pass_headers_option

			if( sub_unique_task_map.hasOwnProperty( bl_unit_id ) ) {
			    let end_socket_controller = sub_unique_task_map [ bl_unit_id ]
				let end_socket = end_socket_controller .end_socket_session .request({
                    ":method": "POST"
                })
                req.pipe(end_socket)
				end_socket.pipe(res)
			}
        }
    }

    // http | tcp support default : no zip | no encrypt
    try { unlinkSync(sub_sr_bind_addr) } catch(err) {}
    let sub_http_sr = http.createServer((req, res)=>{
        // TODO add suiteable matcher | filter
        
        let bl_unit_id = new URL("p://d"+req.url).searchParams.get("bl_unit_id")
        let services = url_format.path_services(req.url)

        // console.log(
        //     "sub proc > sub_sr: req.url: ", req.url,
        //     // "\nsub proc > sub_sr: sub_unique_task_map: ", sub_unique_task_map, 
        //     "\nsub proc > sub_sr : services & bl_unit_id; ", services, bl_unit_id,
        // )

        sub_req_handlers [ services[0] ] ?. (req, res, bl_unit_id)
    })
	.listen(sub_sr_bind_addr)

    process.on("message", (msg, handle)=>{
        ipc_sub_msg_handlers [msg.sn] ?. (msg, handle)
    })

    http2.createSecureServer({cert: readFileSync(config.http_cert()),key: readFileSync(config.http_key())}, (req, res) =>{

        let bl_src_req_id  = count_uid_generator.get() ;

        let bl_start_req_msg = {
            sn: "bl_start",
            svcs: [
                {api: "https://127.0.0.1:4001", type:"http2s"},
                {api: "https://127.0.0.1:4002", type:"http2s"},
                {api: "https://127.0.0.1:4003", type:"http2s"},
            ],
            bl_rule: "first_responsed",
            bl_src_req_id,
            from: {
                wid: cluster.worker.id,
            }
        }

        process.send(bl_start_req_msg)

        let bl_end_handler = bl_end_req_msg => {
            // single proc multi req / multi proc multi req/ bl_unit / proc
            // other proc recived: bl_sr_req_id == this.bl_src_req_id

            // console.log(
            //     "sub proc > src req > bl_end_handler: bl_end_req_msg: ", bl_end_req_msg 
            // )

            if(
                bl_end_req_msg .bl_src_req_id == bl_src_req_id // from this req
                && bl_end_req_msg ?.from ?.wid == cluster.worker.id // from this proc
            ) {

                
               
                
                let bl_end_handlers = {
                    ... {
                        transmit_headers: {header: "content"}
                    },
                    ok(){

                        let bl_end_handler_THIS = this || bl_end_handlers
                        let end_req = http.request({
                            socketPath: bl_end_req_msg .sub_sr_bind_addr,
                            path: "/bl_pipeline/?bl_unit_id=" + bl_end_req_msg .bl_unit_id,
                            // TODO bl parser: pipeline request, pipeline req handler matcher parser
                        }, end_res=>{
                            end_res.pipe(res)
                            end_res.on("end", ()=>{
                                res.end()
                                end_req.destroy()
                                bl_end_handler_THIS.final()
                            })
                        })
                        req.pipe(end_req)
                        // req.on("end", ()=>{
                            // end_req.end()
                        // })
                    },
                    err(){
                        let bl_end_handler_THIS = this || bl_end_handlers
                        bl_end_handler_THIS.final()
                    },
                    final(){
                        // clean bl_start_primary_scope  
                        process.send({
                            sn: bl_end_req_msg ?.bl_start_primary_scope_clean_handler_id
                        })
                        // clean sub bl unit proc: clean by unit selef
                        // clean sub bl src req proc scope
                        count_uid_generator.free(bl_src_req_id)
                        process.removeListener("message", bl_end_handler)
                    }
                }

                let proxy_bl_end_handlers = {
                    ...bl_end_handlers,
                }

                proxy_bl_end_handlers.err = function(){
                    bl_end_handlers.err.apply(this, arguments)
                    bl_end_handlers.final.apply(this, arguments)
                }

                proxy_bl_end_handlers.ok = function(){
                    bl_end_handlers.ok.apply(this, arguments)
                    bl_end_handlers.final.apply(this, arguments)

                }

                proxy_bl_end_handlers [ bl_end_req_msg.bl_state ] ?. ()


            }

        }

        process.addListener("message", bl_end_handler)

    }). listen(4000, "0.0.0.0", ()=>{
        console.log(
            "sub sr listen addr: ", sub_sr_bind_addr
        )
    })

}
